from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import difflib

#YOUTUBE

import yt_dlp
import random


app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, '..', '..', 'database', 'seeds', 'chatbot_data.json')
MUSIC_PATH = os.path.join(BASE_DIR, '..', '..', 'database', 'seeds', 'music')


# Playlist pública
PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLnQk7mL7orO8SZXEDKo4xEcuEMgHjvTgO"


# Respuestas especiales con música
SPECIAL_MUSIC_RESPONSES = {
    "pon música": {
        "response": "¡Claro! Aquí va La Jumpa de Arcángel y Bad Bunny.",
        "music_file": "Arcangel, Bad Bunny - La Jumpa (Video Oficial) SR. SANTOS.mp3"
    },
    "qué es esto": {
        "response": "Esto es un recuerdo del show de Arcángel en Tenerife 2023. 🎤",
        "music_file": "Recuerdos.mp3"
    }
}

#MUSICA YOUTUBE
def get_random_song_from_playlist():
    try:
        ydl_opts = {
            'quiet': True,
            'extract_flat': True,
            'skip_download': True
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(PLAYLIST_URL, download=False)
            videos = [entry for entry in info.get('entries', []) if 'id' in entry]
            if not videos:
                return None, None
            choice = random.choice(videos)
            video_id = choice['id']
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            return video_id, video_url
    except Exception as e:
        print(f"Error obteniendo playlist: {e}")
        return None, None




def load_training_data():
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f" Error cargando datos del chatbot: {e}")
        return []

def get_response(user_input):

    user_input = user_input.lower()


    # Si el usuario pide música de YouTube
    if user_input in ["reproduce algo", "youtube"]:
        video_id, song_url = get_random_song_from_playlist()
        if song_url:
            return {
                "text": "🎵 Aquí tienes algo para ti:",
                "youtube_url": song_url,
                "youtube_id": video_id
            }, None
        else:
            return {"text": "No pude encontrar canciones en la playlist 😢"}, None



    # Revisión de respuestas musicales exactas
    for key, val in SPECIAL_MUSIC_RESPONSES.items():
        if key in user_input:
            return val["response"], val["music_file"]

    # Cargar datos actualizados en tiempo real
    training_data = load_training_data()

    # Revisión con coincidencia flexible
    best_match = None
    highest_score = 0

    for item in training_data:
        for phrase in item.get('input', []):
            score = difflib.SequenceMatcher(None, phrase.lower(), user_input).ratio()
            if score > highest_score:
                highest_score = score
                best_match = item.get('response', '')

    if highest_score > 0.6:
        return best_match, None

    return "Lo siento, no entiendo tu pregunta. ¿Puedes decirlo de otra forma, parcero?", None

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.json
    user_input = data.get('message', '')
    response, music_file = get_response(user_input)


    #MUSICA 
    # Si la respuesta es un dict (cuando hay YouTube)
    if isinstance(response, dict):
        return jsonify({
            'response': response.get('text'),
            'music': music_file,
            'youtube_url': response.get('youtube_url'),
            'youtube_id': response.get('youtube_id')
    })


    return jsonify({'response': response, 'music': music_file})

@app.route('/api/music/<path:filename>')
def get_music(filename):
    return send_from_directory(MUSIC_PATH, filename)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
