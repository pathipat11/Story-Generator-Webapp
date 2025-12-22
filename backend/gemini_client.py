import os
import time
from dotenv import load_dotenv
from google import genai

load_dotenv()

def _get_key() -> str:
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""

def generate_text(model: str, prompt: str) -> str:
    api_key = _get_key()
    if not api_key:
        raise RuntimeError("Missing GEMINI_API_KEY or GOOGLE_API_KEY in environment/.env")

    client = genai.Client(api_key=api_key)

    # retry 1 ครั้งถ้า 429
    for attempt in range(2):
        try:
            resp = client.models.generate_content(model=model, contents=prompt)
            return (resp.text or "").strip()
        except Exception as e:
            s = str(e)
            if attempt == 0 and ("429" in s or "RESOURCE_EXHAUSTED" in s):
                time.sleep(1.5)
                continue
            raise
