from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import db, User, Complaint, Notification, ChatMessage
from config import Config
import requests
import uuid
import json
import re
from datetime import datetime

# Model imports
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from groq import Groq
import os

app = Flask(__name__)
app.config.from_object(Config)

CORS(app)
db.init_app(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

# =========================
# Load BERT complaint model globally
# =========================
try:
    model_path = "bert_complaint_model"
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    model.eval()
    print("Successfully loaded BERT model.")
except Exception as e:
    print(f"Warning: Could not load BERT model from {model_path}. Error: {e}")
    tokenizer = None
    model = None

labels = [
    "Account Services",
    "Credit Card",
    "Credit Reporting",
    "Debt Collection",
    "Loan",
    "Money Transfer",
    "Other"
]

def clean(text):
    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def rule_based_category(text):
    if any(word in text for word in ["emi", "installment", "repayment", "loan payment", "interest rate", "loan balance"]):
        return "Loan"
    if any(word in text for word in ["credit card", "card charge", "card payment", "unauthorized charge"]):
        return "Credit Card"
    if any(word in text for word in ["upi", "transfer", "sent money", "payment failed", "transaction failed"]):
        return "Money Transfer"
    return None

def predict_category(text):
    clean_text = clean(text)
    rule_category = rule_based_category(clean_text)
    if rule_category:
        return rule_category
        
    if model is None or tokenizer is None:
        return "Other"

    inputs = tokenizer(
        clean_text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=256
    )

    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits
    predicted_class = torch.argmax(logits, dim=1).item()

    return labels[predicted_class]

# =========================
# Helper function for AI analysis
# =========================
def call_ai_analysis(complaint_text, product_type, channel, location, bulk_mode=False):
    GROQ_API_KEY = app.config.get('GROQ_API_KEY') or os.getenv('GROQ_API_KEY')
    if not GROQ_API_KEY:
        return {"error": "GROQ_API_KEY is not configured"}
        
    groq_client = Groq(api_key=GROQ_API_KEY)
    
    # 1. Predict Category locally
    category = predict_category(complaint_text)

    # 2. Get other structured fields using LLaMA via Groq JSON mode
    system_prompt = f"""You are a banking complaint analysis AI. Analyze the complaint and return JSON.
The category has already been determined as: {category}.
Return valid JSON with exactly these keys:
- "sentiment": "positive"|"negative"|"neutral"
- "frustration_score": 1-10
- "priority_score": 1-100
- "escalation_risk": 0.00-1.00
- "ai_response_draft": professional 2-3 sentence response acknowledging the issue, explaining the {category} process, and next steps.
- "ai_root_cause": brief root cause (1 sentence)
Context: Product: {product_type or 'Unknown'}, Channel: {channel or 'Unknown'}, Location: {location or 'Unknown'}"""

    try:
        chat = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": complaint_text}
            ],
            response_format={"type": "json_object"}
        )
        
        content = chat.choices[0].message.content
        result = json.loads(content)
        result["category"] = category
        return result
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

# Health Check
@app.route('/api/health')
def health():
    return jsonify({"status": "ok"})

# Auth Routes
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"msg": "User already exists"}), 400
    
    new_user = User(email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"msg": "User created"}), 201

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token, user={"id": str(user.id), "email": user.email}), 200
    return jsonify({"msg": "Bad email or password"}), 401

# Complaint Routes
@app.route('/api/complaints', methods=['GET'])
@jwt_required()
def get_complaints():
    complaints = Complaint.query.order_by(Complaint.created_at.desc()).all()
    return jsonify([{
        "id": str(c.id),
        "complaint_text": c.complaint_text,
        "category": c.category,
        "sentiment": c.sentiment,
        "status": c.status,
        "priority_score": c.priority_score,
        "frustration_score": c.frustration_score,
        "created_at": c.created_at.isoformat(),
        "location": c.location
    } for c in complaints])

@app.route('/api/complaints/<complaint_id>', methods=['GET'])
def get_complaint(complaint_id):
    c = Complaint.query.get_or_404(complaint_id)
    return jsonify({
        "id": str(c.id),
        "complaint_text": c.complaint_text,
        "category": c.category,
        "sentiment": c.sentiment,
        "status": c.status,
        "priority_score": c.priority_score,
        "frustration_score": c.frustration_score,
        "escalation_risk": float(c.escalation_risk) if c.escalation_risk else None,
        "ai_response_draft": c.ai_response_draft,
        "ai_root_cause": c.ai_root_cause,
        "created_at": c.created_at.isoformat(),
        "product_type": c.product_type,
        "channel": c.channel,
        "location": c.location
    })

@app.route('/api/complaints', methods=['POST'])
def create_complaint():
    try:
        data = request.json
        complaint_text = data.get('complaint_text')
        product_type = data.get('product_type', 'General')
        channel = data.get('channel', 'Manual')
        location = data.get('location', 'Unknown')
        user_id = data.get('user_id', '00000000-0000-0000-0000-000000000000')

        analysis = call_ai_analysis(complaint_text, product_type, channel, location)
        
        if "error" in analysis:
            print(f"AI Analysis Error: {analysis['error']}")
            return jsonify(analysis), 500

        new_complaint = Complaint(
            user_id=user_id,
            complaint_text=complaint_text,
            product_type=product_type,
            channel=channel,
            location=location,
            category=analysis.get('category'),
            sentiment=analysis.get('sentiment'),
            frustration_score=analysis.get('frustration_score'),
            priority_score=analysis.get('priority_score'),
            escalation_risk=analysis.get('escalation_risk'),
            ai_response_draft=analysis.get('ai_response_draft'),
            ai_root_cause=analysis.get('ai_root_cause'),
            status='new'
        )
        
        db.session.add(new_complaint)
        db.session.commit()
        
        if new_complaint.priority_score >= 70:
            notif = Notification(
                title="High Priority Complaint",
                message=f"A complaint with priority score {new_complaint.priority_score} has been submitted.",
                type="warning",
                complaint_id=new_complaint.id
            )
            db.session.add(notif)
            db.session.commit()

        return jsonify({"id": str(new_complaint.id)}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_standalone():
    data = request.json
    analysis = call_ai_analysis(
        data.get('complaint_text'),
        data.get('product_type'),
        data.get('channel'),
        data.get('location'),
        data.get('bulk_mode', False)
    )
    return jsonify(analysis)

@app.route('/api/complaints/<complaint_id>/status', methods=['PATCH'])
@jwt_required()
def update_status(complaint_id):
    c = Complaint.query.get_or_404(complaint_id)
    data = request.json
    c.status = data.get('status', c.status)
    db.session.commit()
    return jsonify({"msg": "Status updated"})

# Notifications
@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    notifications = Notification.query.order_by(Notification.created_at.desc()).limit(50).all()
    return jsonify([{
        "id": str(n.id),
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "is_read": n.is_read,
        "complaint_id": str(n.complaint_id) if n.complaint_id else None,
        "created_at": n.created_at.isoformat()
    } for n in notifications])

@app.route('/api/notifications/<id>/read', methods=['PATCH'])
@jwt_required()
def mark_notification_read(id):
    n = Notification.query.get_or_404(id)
    n.is_read = True
    db.session.commit()
    return jsonify({"msg": "Marked as read"})

# Chat routes
@app.route('/api/complaints/<complaint_id>/messages', methods=['GET'])
def get_chat_messages(complaint_id):
    messages = ChatMessage.query.filter_by(complaint_id=complaint_id).order_by(ChatMessage.created_at.asc()).all()
    return jsonify([{
        "id": str(m.id),
        "role": m.role,
        "content": m.content,
        "created_at": m.created_at.isoformat()
    } for m in messages])

@app.route('/api/complaints/<complaint_id>/messages', methods=['POST'])
def post_chat_message(complaint_id):
    data = request.json
    new_msg = ChatMessage(
        complaint_id=complaint_id,
        role=data.get('role', 'user'),
        content=data.get('content')
    )
    db.session.add(new_msg)
    db.session.commit()
    return jsonify({"id": str(new_msg.id)}), 201

# AI Assistant standalone
@app.route('/api/ai-assistant', methods=['POST'])
def ai_assistant():
    data = request.json
    messages = data.get('messages', [])
    GROQ_API_KEY = app.config.get('GROQ_API_KEY') or os.getenv('GROQ_API_KEY')
    
    if not GROQ_API_KEY:
        return {"error": "GROQ_API_KEY is not configured"}, 500
        
    groq_client = Groq(api_key=GROQ_API_KEY)
    
    latest_msg = messages[-1]['content'] if messages else ""
    category = predict_category(latest_msg) if latest_msg else "Unknown"
    
    system_prompt = f"""You are an experienced banking customer support assistant working for a bank.
Your job is to help customers understand and resolve their banking complaints.

Detected Issue Category: {category}

Provide a clear and helpful response following this structure:
1. Acknowledge the customer's concern in a polite and empathetic tone.
2. Briefly explain the possible reason for the issue.
3. Provide practical steps the customer can take to resolve the issue.
4. If necessary, suggest contacting the bank branch or support team.
5. Reassure the customer that the issue can usually be resolved.

Important rules:
- Do not invent bank policies or exact timelines unless they are generally applicable.
- Do not mention AI, classification, or system detection.
- Keep the response professional, clear, and concise.
- Focus on helping the customer resolve the problem.
Write the response as if you are a real banking support agent."""
    
    try:
        formatted_messages = [{"role": "system", "content": system_prompt}] + messages[-10:]
        
        chat = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=formatted_messages
        )
        reply = chat.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Incident Commander
@app.route('/api/incident-commander', methods=['GET'])
@jwt_required()
def incident_commander():
    # Mock data for demonstration
    return jsonify({
        "total_complaints_analyzed": Complaint.query.count(),
        "incidents": [
            {
                "title": "UPI Server Timeout Cluster",
                "severity": "high",
                "complaint_count": 12,
                "cities_affected": ["Mumbai", "Delhi", "Pune"],
                "root_cause_probability": 85,
                "root_cause_description": "Network latency in the UPI gateway provider's Mumbai data center.",
                "recommended_actions": [
                    "Switch traffic to secondary node",
                    "Issue customer alert for UPI delay",
                    "Escalate to vendor"
                ],
                "affected_products": ["UPI", "Mobile Banking"]
            }
        ],
        "crisis_forecast": {
            "risk_level": "medium",
            "message": "Potential increase in Credit Card issues predicted for next 48 hours based on recent social media sentiment trends.",
            "predicted_volume": "+15%",
            "potential_triggers": ["Billing cycle end", "Holiday weekend"]
        },
        "fraud_signals": [
            {
                "signal": "High frequency of ATM failed attempts in single location",
                "risk_level": "critical",
                "affected_count": 3,
                "recommendation": "Block ATM ID 5029 and dispatch security"
            }
        ],
        "root_cause_scores": [
            {"cause": "Backend Timeout", "confidence": 92, "evidence_count": 8},
            {"cause": "Mobile App Bug", "confidence": 45, "evidence_count": 3}
        ],
        "resolution_recommendations": [
            {"priority": "immediate", "action": "Restart UPI Gateway Node 2", "impact_estimate": "High", "owner": "Ops Team"}
        ],
        "cascades": [
            {
                "trigger_issue": "Database Slowdown",
                "total_affected": 25,
                "downstream_effects": ["UI latency", "Failed login", "Statement generation delay"]
            }
        ],
        "generated_at": datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
