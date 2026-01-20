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
    try:
        product_id = request.args.get("product_id")

        if not product_id:
            return jsonify({"error": "product_id is required"}), 400

        base_url = f"https://www.ceneo.pl/{product_id}"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0 Safari/537.36'}
        response = requests.get(base_url, headers=headers)
        
        if response.status_code != 200:
            return jsonify({"error": "Product not found on Ceneo"}), 404

        page_dom = BeautifulSoup(response.text, "html.parser")

        product_name = utils.extract(page_dom, "h1.product-top__product-info__name")
        image_url = utils.get_product_image(page_dom)

        opinions_count_tag = utils.extract(page_dom, "a.product-review__link > span")
        if not opinions_count_tag:
            return jsonify({"error": "Product has no opinions"}), 404

        all_opinions = []
        current_url = base_url

        while current_url:
            res = requests.get(current_url, headers=headers)
            dom = BeautifulSoup(res.text, "html.parser")
            opinions_tags = dom.select("div.js_product-review")

            for tag in opinions_tags:
                single_opinion = {
                    key: utils.extract(tag, *value)
                    for key, value in utils.selectors.items()
                }
                all_opinions.append(single_opinion)

            next_page_tag = dom.select_one("a.pagination__next")
            current_url = "https://www.ceneo.pl" + next_page_tag["href"].strip() if next_page_tag else None

        df = pd.DataFrame(all_opinions)

        def _stars_to_float(s):
            if isinstance(s, str) and "/" in s:
                return float(s.split("/")[0].replace(",", "."))
            return 0.0

        df["stars_num"] = df["stars"].apply(_stars_to_float)
        avg_stars = float(df["stars_num"].mean()) if not df.empty else 0
        stars_dist = {str(k): int(v) for k, v in df["stars_num"].value_counts().items()}
        recom_dist = {str(k): int(v) for k, v in df["recommendation"].value_counts().items()}
        stars_chart_url, recommendations_chart_url = utils.create_charts(all_opinions, product_id)

        stats = {
            "product_id": str(product_id),
            "product_name": product_name,
            "image_url": image_url,
            "opinions_count": len(all_opinions),
            "average_stars": round(avg_stars, 2),
            "stars_distribution": stars_dist,
            "recommendations_distribution": recom_dist,
            "stars_chart": stars_chart_url,
            "recommendations_chart": recommendations_chart_url
        }

        opinions_path = os.path.join("app/static/opinions", f"{product_id}.json")
        product_stats_path = os.path.join("app/static/products", f"{product_id}.json")
        
        utils.save_json(all_opinions, opinions_path)
        utils.save_json(stats, product_stats_path)

        include = request.args.get("include_opinions")
        payload = {
            "stats": stats,
            "charts": {
                "stars": stars_chart_url,
                "recommendations": recommendations_chart_url,
            }
        }
        
        if include in ("1", "true", True):
            payload["opinions"] = all_opinions

        return jsonify(payload), 200

    except Exception as e:
        print("--- KRYTYCZNY BŁĄD EKSTRAKCJI ---")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

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


