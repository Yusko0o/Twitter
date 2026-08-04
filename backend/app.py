from flask import Flask, render_template
from backend.GetPfp import getpfp

app = Flask(__name__)

#routes


#starter

@app.route("/")
def home():
    return render_template("index.html")