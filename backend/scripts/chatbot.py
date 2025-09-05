from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import difflib
import re
import requests

app = Flask(__name__)
CORS(app)

BASE_DIR  = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, '..', '..', 'database', 'seeds', 'chatbot_data.json')

# =========================
# CONFIG BACKEND NOTICIAS
# =========================
NEWS_API_BASE = "http://127.0.0.1:8000"

# Mapa de categorías “visibles” -> exactas en la DB
NEWS_CATEGORY_MAP = {
    "deportes":    "Deportes",
    "judiciales":  "Judiciales",
    "animales":    "Animales",
    "moda":        "Moda",
    "tecnologia":  "Tecnología",
    "tecnología":  "Tecnología",
}

# =========================
# CHATBOT DATA
# =========================
def load_training_data():
    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[chatbot] Error cargando datos del chatbot: {e}")
        return []

# =========================
# HELPERS NOTICIAS
# =========================
def normalize_category(raw: str) -> str:
    if not raw:
        return ""
    key = raw.strip().lower()
    return NEWS_CATEGORY_MAP.get(key, raw.strip())

def parse_news_query(user_input: str):
    """
    Patrones soportados:
      - 'traeme noticias'            -> (5, None)
      - 'traeme 5 noticias de moda'  -> (5, 'Moda')
      - 'dame 3 de tecnología'       -> (3, 'Tecnología')
      - 'noticias de animales 8'     -> (8, 'Animales')
      - 'quiero 2 noticias'          -> (2, None)
    """
    text = user_input.lower()

    # Detecta intención de noticias
    if not re.search(r"\bnoticia(s)?\b", text):
        if not re.search(r"\btra(e|é)me\b|\bdame\b|\bmostrar\b|\bquiero\b", text):
            return None

    # Número (por defecto 5)
    m_num = re.search(r"\b(\d{1,2})\b", text)
    count = int(m_num.group(1)) if m_num else 5
    count = max(1, min(count, 20))

    # Categoría después de 'de ...'
    m_cat = re.search(r"\bde\s+([a-záéíóúñ]+)\b", text)
    category = None
    if m_cat:
        category = normalize_category(m_cat.group(1))
    else:
        # O palabra suelta conocida
        for k in NEWS_CATEGORY_MAP.keys():
            if re.search(rf"\b{k}\b", text):
                category = normalize_category(k)
                break

    return (count, category)

def fetch_news_urls(count: int, category: str | None):
    """
    Llama al backend Django y devuelve lista de URLs (strings).
    - Si category es None -> /news/random/?limit=...
    - Si category existe  -> /news/?q=Categoria&limit=...
    """
    try:
        if category:
            params = {"q": category, "limit": str(count)}
            url = f"{NEWS_API_BASE.rstrip('/')}/news/"
        else:
            params = {"limit": str(count)}
            url = f"{NEWS_API_BASE.rstrip('/')}/news/random/"

        resp = requests.get(url, params=params, timeout=6)
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, list):
            return []

        urls = []
        for item in data[:count]:
            urls.append(item.get("url") or "#")
        return urls
    except Exception as e:
        print(f"[chatbot] Error consultando noticias: {e}")
        return []

# =========================
# CORE RESPONSE
# =========================
def get_response(user_input):
    user_input = user_input.lower()

    # ——— Intención de noticias ———
    parsed = parse_news_query(user_input)
    if parsed:
        count, category = parsed
        urls = fetch_news_urls(count, category)
        if urls:
            header = (
                f" Aquí tienes {len(urls)} noticias de {category}:\n\n"
                if category else
                f" Aquí tienes {len(urls)} noticias:\n\n"
            )
            # Doble salto de línea entre enlaces
            body = "\n\n".join(f"{i}. {u}" for i, u in enumerate(urls, start=1))
            return f"{header}{body}"

        return "No encontré noticias para esa consulta. Intenta con otra categoría o un número distinto."

    # ——— Similitud difusa con tu JSON ———
    training_data = load_training_data()
    best_match = None
    highest_score = 0.0

    for item in training_data:
        for phrase in item.get('input', []):
            score = difflib.SequenceMatcher(None, phrase.lower(), user_input).ratio()
            if score > highest_score:
                highest_score = score
                best_match = item.get('response', '')

    if highest_score > 0.6:
        return best_match

    return "Lo siento, no entiendo tu pregunta. ¿Puedes decirlo de otra forma, parcero?"

# =========================
# ROUTES
# =========================
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.json or {}
    user_input = data.get('message', '')
    response_text = get_response(user_input)
    return jsonify({'response': response_text})

# =========================
# MAIN
# =========================
if __name__ == '__main__':
    app.run(port=5000, debug=True)
