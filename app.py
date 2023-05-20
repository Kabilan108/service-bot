"""
AI Customer Service Bot
"""

from flask import Flask, request, render_template
from tempfile import NamedTemporaryFile
from decouple import config
import elevenlabs as el
import openai as ai
import pickle
import base64
import os


el.set_api_key(config("ELEVEN_API_KEY"))  # type: ignore
ai.api_key = config("OPENAI_API_KEY")
VOICE = "Antoni"

app = Flask(__name__)


def ChatCompletion(prompt):
    completion = ai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "You are a customer service agent. You are helping a customer with a problem. You try your best to provide concise, accurate and helpful answers to the customer's questions.",
            },
            {"role": "user", "content": prompt},  # type: ignore
        ],
    )
    return completion.choices[0].message.content  # type: ignore


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/default", methods=["POST"])
def default_response():
    """This is the default bot response"""

    data = request.json

    if "audioMessage" in data:  # type: ignore
        # decode base64 string
        audio_data = base64.b64decode(data["audioMessage"])  # type: ignore

        # write to temp file
        with NamedTemporaryFile(suffix=".wav", delete=False) as tf:
            tf.write(audio_data)
            tf_path = tf.name

        # transcribe audio
        with open(tf_path, "rb") as audio:
            try:
                transcript = ai.Audio.transcribe("whisper-1", audio, prompt="")
            except Exception as e:
                return {"error": str(e)}

        # prompt the assistant
        completion = ChatCompletion(transcript.text)  # type: ignore

        # generate audio response
        audio = el.generate(
            text=completion, voice=VOICE, model="eleven_multilingual_v1"
        )

        # encode the response
        audio_base64 = base64.b64encode(audio).decode("utf-8")
        return {"audioResponse": audio_base64}

    elif "textMessage" in data:  # type: ignore
        # prompt the assistant
        completion = ChatCompletion(data["textMessage"])  # type: ignore

        return {"textResponse": completion}

    return {"error": "Invalid request. No 'audioMessage' or 'textMessage' found."}


if __name__ == "__main__":
    app.run(port=5000, debug=True)
