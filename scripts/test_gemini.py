from app.config import settings
from google import genai

key = settings.GEMINI_API_KEY
client = genai.Client(api_key=key)

for model_id in ["gemini-2.5-flash-lite", "gemini-flash-latest", "gemini-3.5-flash"]:
    try:
        print(f"Testing model: {model_id}")
        response = client.models.generate_content(
            model=model_id,
            contents="Say 'Connected successfully!'"
        )
        print(f"SUCCESS with {model_id}:", response.text.strip())
        break
    except Exception as e:
        print(f"Failed {model_id}: {e}")
