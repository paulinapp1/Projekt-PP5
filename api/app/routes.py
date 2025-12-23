from app import app
from flask import render_template, request, jsonify
import requests
from bs4 import BeautifulSoup
import pandas as pd
from . import utils
import json
import os


@app.route("/api/extract", methods=["POST", "GET"])
def api_extract():
    """
    Extract product opinions from Ceneo
    ---
    parameters:
      - name: product_id
        in: query
        type: string
        required: true
        description: The Ceneo product ID (e.g., 12345678)
      - name: include_opinions
        in: query
        type: boolean
        description: Whether to return the full list of opinions in the response
    responses:
      200:
        description: Product data and statistics extracted successfully
      400:
        description: Missing product_id
      404:
        description: Product not found or has no opinions
    """
    # accept product_id via query string, form or JSON body
    if request.method == "POST":
        data = request.get_json(silent=True) or request.form
        product_id = data.get("product_id") if data else None
    else:
        product_id = request.args.get("product_id")

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    base_url = f"https://www.ceneo.pl/{product_id}"
    response = requests.get(base_url)
    if response.status_code != requests.codes["ok"]:
        return jsonify({"error": "product not found"}), 404

    page_dom = BeautifulSoup(response.text, "html.parser")
    opinions_count = utils.extract(page_dom, "a.product-review__link > span")
    if not opinions_count:
        return jsonify({"error": "product has no opinions"}), 404

    product_name = utils.extract(page_dom, "h1.product-top__product-info__name")
    all_opinions = []
    url = base_url

    while url:
        response = requests.get(url)
        page_dom = BeautifulSoup(response.text, "html.parser")
        opinions = page_dom.select("div .js_product-review")

        for opinion in opinions:
            single_opinion = {
                key: utils.extract(opinion, *value)
                for key, value in utils.selectors.items()
            }
            all_opinions.append(single_opinion)

        try:
            url = (
                "https://www.ceneo.pl/"
                + page_dom.select_one("a.pagination__next")["href"].strip()
            )
        except TypeError:
            url = None

    # compute stats
    df = pd.DataFrame(all_opinions)

    def _stars_to_float(s):
        if isinstance(s, str):
            return float(s.split("/")[0].replace(",", "."))
        return s

    stats = {
        "product_id": product_id,
        "product_name": product_name,
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

    include = request.args.get("include_opinions") or (request.json or {}).get(
        "include_opinions"
    )
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


def _load_products():
    products_dir = "app/static/products"
    opinions_dir = "app/static/opinions"

    # ensure opinions dir exists (keeps previous behavior)
    if not os.path.isdir(opinions_dir):
        os.makedirs(opinions_dir, exist_ok=True)

    if not os.path.isdir(products_dir):
        return []

    products = []
    for filename in os.listdir(products_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(products_dir, filename)
            with open(file_path, "r", encoding="utf-8") as jf:
                products.append(json.load(jf))
    return products


@app.route("/api/products")
def api_products():
    """
    Get a list of all extracted products
    ---
    responses:
      200:
        description: A list of products stored in the system
    """
    products = _load_products()
    return jsonify({"products": products}), 200



@app.route("/api/product/<product_id>")
def api_product(product_id):
    """
    Get details for a specific product
    ---
    parameters:
      - name: product_id
        in: path
        type: string
        required: true
        description: The ID of the product to retrieve
    responses:
      200:
        description: Product details retrieved successfully
      404:
        description: Product not found locally
    """
    product_path = os.path.join("app/static/products", f"{product_id}.json")
    if not os.path.exists(product_path):
        return jsonify({"error": "product not found"}), 404

    with open(product_path, "r", encoding="utf-8") as jf:
        product = json.load(jf)

    include = request.args.get("include_opinions") or (request.json or {}).get(
        "include_opinions"
    )
    if include in ("1", "true", True):
        opinions_path = os.path.join("app/static/opinions", f"{product_id}.json")
        try:
            with open(opinions_path, "r", encoding="utf-8") as jf:
                product["opinions"] = json.load(jf)
        except FileNotFoundError:
            product["opinions"] = []

    return jsonify(product), 200


