from flask import Flask, request, send_file, render_template
import base64
import os

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["RESPONSE_FOLDER"] = "sounds"


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/default", methods=["POST"])
def default_response():
    """This is the default bot response"""

    data = request.json

    if "audioMessage" in data:  # type: ignore
        with open("assets/audio/voice.wav", "rb") as f:
            audio_base64 = base64.b64encode(f.read()).decode("utf-8")
        return {"audioResponse": audio_base64}
    elif "textMessage" in data:  # type: ignore
        return {"textResponse": "I am not able to do that yet."}

    return {"error": "Invalid request. No 'audioMessage' or 'textMessage' found."}


if __name__ == "__main__":
    app.run(port=5000, debug=True)
