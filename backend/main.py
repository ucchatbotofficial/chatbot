
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import ssl
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()


# Load sensitive config from .env
ASKEVA_API_URL = os.getenv("ASKEVA_API_URL")
ASKEVA_API_TOKEN = os.getenv("ASKEVA_API_TOKEN")
WHATSAPP_NOTIFICATION_NUMBER = os.getenv("WHATSAPP_NOTIFICATION_NUMBER")
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")

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
        
        # Create detailed lead message with actual chatbot data
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
                            {
                                "type": "text",
                                "text": name
                            },
                            {
                                "type": "text", 
                                "text": email
                            },
                            {
                                "type": "text",
                                "text": phone
                            },
                            {
                                "type": "text",
                                "text": course
                            }
                        ]
                    }
                ]
            }
        }
        
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        # Make API request
        response = requests.post(
            f"{ASKEVA_API_URL}?token={ASKEVA_API_TOKEN}",
            headers={
                "Content-Type": "application/json"
            },
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
    print("=== RECEIVED ENQUIRY DETAILS ===")
    print(f"Name: '{details.name}'")
    print(f"Email: '{details.email}'")
    print(f"Course: '{details.course}'")
    print(f"Phone: '{details.phone}'")
    print("================================")
    
    # Email configuration - IMPORTANT: You need to set up Gmail App Password
    sender_email = SENDER_EMAIL
    sender_password = SENDER_PASSWORD

    # SMTP server config
    smtp_host = "smtp.gmail.com"
    smtp_port = 587

    # Email subjects
    student_subject = f"Thank you for your enquiry about {details.course} at Urbancode!"
    admin_subject = f"[Lead] New Enquiry for {details.course} - {details.name}"

    # Dynamic course link (add all Urbancode courses)
    course_links = {
        
        
        "Data Science": "https://urbancode.in/data-science",
        "Data Analysis": "https://urbancode.in/data-analysis",
        "Database": "https://urbancode.in/database",
        "Data Analytics": "https://urbancode.in/data-analytics",
        "Cloud and DevOps": "https://urbancode.in/cloud-and-devops",
        "Programming Languages": "https://urbancode.in/programming-languages",
        "Software Testing": "https://urbancode.in/software-testing",
        "Kids": "https://urbancode.in/kids",
        "Internship": "https://urbancode.in/internship",
        "Other": "https://urbancode.in/courses",
        "Digital Marketing": "https://urbancode.in/digital-marketing",
        # Add more as needed
    }
    course_link = course_links.get(details.course, "https://urbancode.in/courses")
    
    # Email recipients - send to student, CC to admin
    import re
    email_regex = r"^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$"
    student_email = details.email.strip()
    admin_email = ADMIN_EMAIL
    # Always send to admin; if student email is valid, send to both
    if re.match(email_regex, student_email):
        recipients = [student_email, admin_email]
        print(f"Student email valid. Sending course details to student and admin.")
    else:
        recipients = [admin_email]
        print(f"Invalid student email: {student_email}. Sending course details only to admin.")

    # Compose two different HTML bodies: one for student, one for admin
    student_html_body = f"""
    <html>
    <body style='font-family: Arial, sans-serif; background: #f9f9f9; padding: 0; margin: 0;'>
        <table width='100%' bgcolor='#f9f9f9' cellpadding='0' cellspacing='0' border='0'>
            <tr>
                <td align='center'>
                    <table width='600' bgcolor='#fff' cellpadding='0' cellspacing='0' border='0' style='border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.07); padding:32px 24px;'>
                        <tr><td align='center' style='padding-bottom:24px;'>
                            <img src='https://media.licdn.com/dms/image/v2/D560BAQEK-F1WIVfThA/company-logo_200_200/company-logo_200_200/0/1702897766813?e=1759363200&v=beta&t=LPhYGExqd4mDks78hGNI4OYyBObWLB8_JaiSKI4F7xQ' alt='Urbancode Logo' width='120' style='border-radius:16px;'>
                        </td></tr>
                        <tr><td align='center' style='color:#1AB79D; font-size:24px; font-weight:600; padding-bottom:16px;'>Thank you for your enquiry!</td></tr>
                        <tr><td align='center' style='font-size:16px; color:#222; padding-bottom:8px;'>Hi <b>{details.name}</b>,</td></tr>
                        <tr><td align='center' style='font-size:15px; color:#333; padding-bottom:24px;'>We appreciate your interest in our <b>{details.course}</b> course at Urbancode Educational Services.</td></tr>
                        <tr><td align='center' style='padding-bottom:32px;'>
                            <a href='{course_link}' style='display:inline-block; background:#1AB79D; color:#fff; font-weight:600; padding:14px 32px; border-radius:28px; text-decoration:none; font-size:16px; box-shadow:0 2px 8px rgba(26,183,157,0.12); transition:background 0.2s;'>
                                View {details.course} Course Details
                            </a>
                        </td></tr>
                        <tr><td style='padding:18px 20px; background:#f8f9fa; border-radius:10px; color:#333; font-size:15px;'>
                            <b>About Urbancode:</b><br>
                            Urbancode Edutech Solutions Private Limited is dedicated to empowering your future, one course at a time.<br>
                            <b>Contact:</b> <a href='mailto:ucchatbotofficial@gmail.com' style='color:#1AB79D;'>ucchatbotofficial@gmail.com</a> | <b>Phone:</b> +91-98787 98797<br>
                            <b>Website:</b> <a href='https://urbancode.in' style='color:#1AB79D;'>https://urbancode.in</a><br>
                            <b>Address:</b> 9/29, 5th St, Kamakoti Nagar, Pallikaranai, Chennai, Tamil Nadu 600100
                        </td></tr>
                        <tr><td align='center' style='color:#888; font-size:13px; padding-top:32px;'>This message was sent by Urbancode Chatbot System.<br>Dream big, learn bigger.</td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    admin_html_body = f"""
    <html>
    <body style='font-family: Arial, sans-serif; background: #f9f9f9; padding: 0; margin: 0;'>
        <table width='100%' bgcolor='#f9f9f9' cellpadding='0' cellspacing='0' border='0'>
            <tr>
                <td align='center'>
                    <table width='600' bgcolor='#fff' cellpadding='0' cellspacing='0' border='0' style='border-radius:12px; box-shadow:0 2px 12px rgba(0,0,0,0.07); padding:32px 24px;'>
                        <tr><td align='center' style='padding-bottom:24px;'>
                            <img src='https://media.licdn.com/dms/image/v2/D560BAQEK-F1WIVfThA/company-logo_200_200/company-logo_200_200/0/1702897766813?e=1759363200&v=beta&t=LPhYGExqd4mDks78hGNI4OYyBObWLB8_JaiSKI4F7xQ' alt='Urbancode Logo' width='120' style='border-radius:16px;'>
                        </td></tr>
                        <tr><td align='center' style='color:#1AB79D; font-size:24px; font-weight:600; padding-bottom:16px;'>New Chatbot Lead Received</td></tr>
                        <tr><td style='padding:18px 20px; background:#f0f8f7; border-radius:10px; color:#1AB79D; font-size:15px;'>
                            <b>Lead Details:</b><br>
                            Name: {details.name}<br>
                            Email: {details.email}<br>
                            Course: {details.course}<br>
                            Phone: {details.phone}
                        </td></tr>
                        <tr><td align='center' style='padding-bottom:32px; padding-top:32px;'>
                            <a href='{course_link}' style='display:inline-block; background:#1AB79D; color:#fff; font-weight:600; padding:14px 32px; border-radius:28px; text-decoration:none; font-size:16px; box-shadow:0 2px 8px rgba(26,183,157,0.12); transition:background 0.2s;'>
                                View {details.course} Course Details
                            </a>
                        </td></tr>
                        <tr><td style='padding:18px 20px; background:#f8f9fa; border-radius:10px; color:#333; font-size:15px;'>
                            <b>About Urbancode:</b><br>
                            Urbancode Edutech Solutions Private Limited is dedicated to empowering your future, one course at a time.<br>
                            <b>Contact:</b> <a href='mailto:ucchatbotofficial@gmail.com' style='color:#1AB79D;'>ucchatbotofficial@gmail.com</a> | <b>Phone:</b> +91-98787 98797<br>
                            <b>Website:</b> <a href='https://urbancode.in' style='color:#1AB79D;'>https://urbancode.in</a><br>
                            <b>Address:</b> 9/29, 5th St, Kamakoti Nagar, Pallikaranai, Chennai, Tamil Nadu 600100
                        </td></tr>
                        <tr><td align='center' style='color:#888; font-size:13px; padding-top:32px;'>This message was sent by Urbancode Chatbot System.<br>Dream big, learn bigger.</td></tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    # Plain text version for email clients that don't support HTML
    text_body = f"""
    {details.course} - Course Details (Urbancode)

    Hi {details.name},

    Thank you for your interest in our {details.course} course at Urbancode Educational Services.
    You can view the full course details here: {course_link}

    Our team will contact you soon with more information and answer any questions you may have.
    If you want to speak to us directly, call +91-98787 98797.

    This message was sent by Urbancode Chatbot System.
    """
    # (Removed duplicate/unassigned text_body block)
    
    print(f"Attempting to send email from {sender_email} to: {recipients}")
    print(f"Student email: {student_email}")
    print(f"Student email valid: {re.match(email_regex, student_email) is not None}")
    
    # Check if password is set correctly
    if sender_password == "":
        print("ERROR: Please set up your Gmail App Password first!")
        print("Instructions:")
        print("1. Go to https://myaccount.google.com/security")
        print("2. Enable 2-Step Verification if not already enabled")
        print("3. Go to 'App passwords'")
        print("4. Generate a new app password for 'Mail'")
        print("5. Replace 'YOUR_APP_PASSWORD_HERE' with the generated password")
        return {"status": "error", "detail": "Gmail App Password not configured. Please check the backend code."}
    

    try:
        for recipient in recipients:
            msg = MIMEMultipart('alternative')
            msg['From'] = sender_email
            msg['To'] = recipient
            if recipient == admin_email:
                msg['Subject'] = admin_subject
                html_part = MIMEText(admin_html_body, 'html')
            else:
                msg['Subject'] = student_subject
                html_part = MIMEText(student_html_body, 'html')

            text_part = MIMEText(text_body, 'plain')
            msg.attach(text_part)
            msg.attach(html_part)

            print(f"Sending email to: {recipient}")
            print(f"Connecting to {smtp_host}:{smtp_port}")

            context = ssl.create_default_context()
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            server.set_debuglevel(1)

            print("Starting TLS...")
            server.starttls(context=context)

            print(f"Logging in with {sender_email}")
            server.login(sender_email, sender_password)

            print("Login successful, sending email...")
            server.sendmail(sender_email, recipient, msg.as_string())

            print("Email sent successfully!")
            server.quit()

        print("=== SENDING WHATSAPP NOTIFICATION ===")
        print(f"Sending lead details to WhatsApp: {WHATSAPP_NOTIFICATION_NUMBER}")
        print(f"Lead Details - Name: {details.name}, Email: {details.email}, Course: {details.course}, Phone: {details.phone}")

        whatsapp_result = send_whatsapp_message(
            WHATSAPP_NOTIFICATION_NUMBER, 
            details.name, 
            details.email, 
            details.course, 
            details.phone
        )

        if whatsapp_result["status"] == "success":
            print(f"✅ WhatsApp notification sent successfully!")
        else:
            print(f"❌ WhatsApp notification failed: {whatsapp_result['detail']}")

        return {
            "status": "success",
            "message": "Form submitted successfully! Email sent and WhatsApp notification attempted.",
            "email_status": "sent",
            "whatsapp_status": whatsapp_result["status"],
            "whatsapp_detail": whatsapp_result.get("detail", "Success")
        }
    except smtplib.SMTPAuthenticationError:
        print("❌ Email authentication failed!")
        return {"status": "error", "detail": "Email authentication failed. Please check your Gmail App Password."}
    except smtplib.SMTPException as e:
        print(f"❌ Email sending failed: {e}")
        return {"status": "error", "detail": f"Email sending failed: {str(e)}"}
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return {"status": "error", "detail": f"Unexpected error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
