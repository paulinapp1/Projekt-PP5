from app import app
from flask import render_template, request, jsonify
import requests
from bs4 import BeautifulSoup
import pandas as pd
from . import utils
import json
import os
import traceback

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/extract", methods=["POST", "GET"])
def api_extract():
    """
    Extract product opinions from Ceneo
    """
    product_id = request.args.get("product_id")
    
    if not product_id:
        data = request.get_json(silent=True) or request.form
        product_id = data.get("product_id") if data else None

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    base_url = f"https://www.ceneo.pl/{product_id}"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
    
    response = requests.get(base_url, headers=headers)
    if response.status_code != requests.codes["ok"]:
        return jsonify({"error": "product not found"}), 404

    page_dom = BeautifulSoup(response.text, "html.parser")
    
    opinions_count_raw = utils.extract(page_dom, "a.product-review__link > span")
    if not opinions_count_raw:
        return jsonify({"error": "product has no opinions"}), 404

    product_name = utils.extract(page_dom, "h1.product-top__product-info__name")
    image_url = utils.get_product_image(page_dom)

    all_opinions = []
    url = base_url

    while url:
        response = requests.get(url, headers=headers)
        page_dom = BeautifulSoup(response.text, "html.parser")
        opinions = page_dom.select("div .js_product-review")

        for opinion in opinions:
            single_opinion = {
                key: utils.extract(opinion, *value)
                for key, value in utils.selectors.items()
            }
            all_opinions.append(single_opinion)

        try:
            next_page = page_dom.select_one("a.pagination__next")
            url = "https://www.ceneo.pl" + next_page["href"].strip() if next_page else None
        except (TypeError, KeyError):
            url = None
    df = pd.DataFrame(all_opinions)

    def _stars_to_float(s):
        if isinstance(s, str) and "/" in s:
            return float(s.split("/")[0].replace(",", "."))
        return s

    stats = {
        "product_id": product_id,
        "product_name": product_name,
        "image_url": image_url,
        "opinions_count": len(all_opinions),
        "average_stars": df["stars"].apply(_stars_to_float).mean(),
        "stars_distribution": df["stars"]
            .apply(_stars_to_float)
            .value_counts()
            .to_dict(),
        "recommendations_distribution": df["recommendation"].value_counts().to_dict(),
    }
    opinions_path = os.path.join("app/static/opinions", f"{product_id}.json")
    utils.save_json(all_opinions, opinions_path)
    product_stats_path = os.path.join("app/static/products", f"{product_id}.json")
    utils.save_json(stats, product_stats_path)
    stars_chart_path, recommendations_chart_path = utils.create_charts(
        all_opinions, product_id
    )

    include = request.args.get("include_opinions") or (request.get_json(silent=True) or {}).get("include_opinions")
    
    payload = {
        "stats": stats,
        "charts": {
            "stars": stars_chart_path,
            "recommendations": recommendations_chart_path,
        },
    }
    
    if include in ("1", "true", True):
        payload["opinions"] = all_opinions

    return jsonify(payload), 200

@app.route("/api/products")
def api_products():
    products_dir = "app/static/products"
    if not os.path.isdir(products_dir):
        os.makedirs(products_dir, exist_ok=True)
        return jsonify({"products": []}), 200

    products = []
    for filename in os.listdir(products_dir):
        if filename.endswith(".json"):
            try:
                with open(os.path.join(products_dir, filename), "r", encoding="utf-8") as jf:
                    products.append(json.load(jf))
            except Exception:
                continue
    return jsonify({"products": products}), 200

@app.route("/api/product/<product_id>")
def api_product(product_id):
    product_path = os.path.join("app/static/products", f"{product_id}.json")
    if not os.path.exists(product_path):
        return jsonify({"error": "product not found locally"}), 404

    with open(product_path, "r", encoding="utf-8") as jf:
        product = json.load(jf)

    include = request.args.get("include_opinions")
    if include in ("1", "true", True):
        opinions_path = os.path.join("app/static/opinions", f"{product_id}.json")
        try:
            with open(opinions_path, "r", encoding="utf-8") as jf:
                product["opinions"] = json.load(jf)
        except FileNotFoundError:
            product["opinions"] = []

    return jsonify(product), 200