from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Load sensitive config from .env
ASKEVA_API_URL = os.getenv("ASKEVA_API_URL")
ASKEVA_API_TOKEN = os.getenv("ASKEVA_API_TOKEN")
WHATSAPP_NOTIFICATION_NUMBER = os.getenv("WHATSAPP_NOTIFICATION_NUMBER")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DetailsRequest(BaseModel):
    name: str
    email: str
    course: str
    phone: str

def send_whatsapp_message(phone_number: str, name: str, email: str, course: str, phone: str):
    """
    Send WhatsApp text message with full lead details using AskEva API
    """
    try:
        # Clean phone number and ensure proper format
        clean_phone = ''.join(filter(str.isdigit, phone_number))
        
        # Add country code if not present (assuming India +91)
        if not clean_phone.startswith('91') and len(clean_phone) == 10:
            clean_phone = '91' + clean_phone
        
        print(f"Sending WhatsApp with lead details to: {clean_phone}")
        
        # Create detailed lead message
        lead_message = f"""NEW LEAD ALERT - URBANCODE

Name: {name}
Email: {email}
Course: {course}
Phone: {phone}

Contact ASAP!"""

        print(f"Lead message to send: {lead_message}")
        
        # Send as template message using utility_wtsp template
        payload = {
            "to": clean_phone,
            "type": "template",
            "template": {
                "name": "utility_wtsp",
                "language": {
                    "code": "en"
                },
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": name},
                            {"type": "text", "text": email},
                            {"type": "text", "text": phone},
                            {"type": "text", "text": course}
                        ]
                    }
                ]
            }
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        # Make API request
        response = requests.post(
            f"{ASKEVA_API_URL}?token={ASKEVA_API_TOKEN}",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        print(f"WhatsApp API Response Status: {response.status_code}")
        print(f"WhatsApp API Response: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if "messages" in response_data and len(response_data["messages"]) > 0:
                message_id = response_data["messages"][0].get("id", "Unknown")
                print(f"✅ WhatsApp lead details sent successfully! ID: {message_id}")
                return {
                    "status": "success", 
                    "message_id": message_id,
                    "lead_details": {
                        "name": name,
                        "email": email,
                        "course": course,
                        "phone": phone
                    },
                    "message_sent": lead_message
                }
            else:
                return {"status": "warning", "detail": "API returned 200 but no message ID"}
        elif response.status_code == 400:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"error": response.text}
            if "Session is not opened" in str(error_data):
                print("❌ WhatsApp session not opened. Please activate your AskEva WhatsApp session first.")
                return {"status": "error", "detail": "WhatsApp session not opened. Please login to AskEva dashboard and activate your WhatsApp session."}
            else:
                return {"status": "error", "detail": f"API error: {response.status_code} - {response.text}"}
        else:
            return {"status": "error", "detail": f"API error: {response.status_code} - {response.text}"}
            
    except Exception as e:
        print(f"WhatsApp sending error: {e}")
        return {"status": "error", "detail": str(e)}

@app.get("/")
def read_root():
    return {"message": "FastAPI backend is working!"}

@app.post("/submit-details")
def submit_details(details: DetailsRequest, request: Request):
    # Debug logging
    print("=== RECEIVED ENQUIRY DETAILS FROM UC-CHATBOT===")
    print(f"Name: '{details.name}'")
    print(f"Email: '{details.email}'")
    print(f"Course: '{details.course}'")
    print(f"Phone: '{details.phone}'")
    print("================================")

    print("=== SENDING WHATSAPP NOTIFICATION ===")
    print(f"Sending lead details to WhatsApp: {WHATSAPP_NOTIFICATION_NUMBER}")

    numbers = [n.strip() for n in (WHATSAPP_NOTIFICATION_NUMBER or "").split(',') if n.strip()]
    if not numbers:
        numbers = [WHATSAPP_NOTIFICATION_NUMBER] if WHATSAPP_NOTIFICATION_NUMBER else []

    whatsapp_results = []
    for num in numbers:
        result = send_whatsapp_message(
            num,
            details.name,
            details.email,
            details.course,
            details.phone
        )
        status = result.get("status", "error")
        detail = result.get("detail", "Success")
        message_id = result.get("message_id")
        whatsapp_results.append({
            "to": num,
            "status": status,
            "detail": detail,
            "message_id": message_id
        })
        if status == "success":
            print(f"✅ WhatsApp notification sent successfully to {num}!")
        else:
            print(f"❌ WhatsApp notification failed for {num}: {detail}")

    overall_status = "success" if any(r.get("status") == "success" for r in whatsapp_results) else (whatsapp_results[0].get("status") if whatsapp_results else "skipped")
    overall_detail = ", ".join([f"{r['to']}: {r.get('status')}" for r in whatsapp_results]) if whatsapp_results else "No WhatsApp numbers configured"

    return {
        "status": "success",
        "message": "Form submitted successfully! WhatsApp notification attempted.",
        "whatsapp_status": overall_status,
        "whatsapp_detail": overall_detail,
        "whatsapp_results": whatsapp_results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
