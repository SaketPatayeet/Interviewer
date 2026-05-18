import os
import json
from huggingface_hub import InferenceClient
from dotenv import load_dotenv
load_dotenv()

client = InferenceClient(
    provider="together",
    api_key=os.environ["HF_TOKEN"]
)

def generate_json(prompt, max_tokens=512,temperature=0.2):

    response = client.chat.completions.create(
        model="Qwen/Qwen2.5-7B-Instruct",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_tokens=max_tokens,
        temperature=0.2,
        response_format={
            "type": "json_object"
        }
    )

    raw = response.choices[0].message.content
    print("\nRAW OUTPUT:\n")
    print(raw)

    return json.loads(raw)