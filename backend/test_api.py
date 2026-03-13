import requests
import json

url = "http://localhost:5000/api/complaints"
payload = {
    "complaint_text": "This is a test complaint.",
    "user_id": "00000000-0000-0000-0000-000000000000"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
