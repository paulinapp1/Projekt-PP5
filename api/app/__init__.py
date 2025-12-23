from flask import Flask
import os
from flasgger import Swagger


app = Flask(__name__)
swagger = Swagger(app)
from app import routes as routes
port = int(os.environ.get("PORT", 5000))



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=port, debug=False)
