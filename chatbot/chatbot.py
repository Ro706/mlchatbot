import torch
import os
import re
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# =========================
# Load BERT complaint model
# =========================

model_path = "bert_complaint_model"

tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

model.eval()

# Label mapping (same order used in training)
labels = [
    "Account Services",
    "Credit Card",
    "Credit Reporting",
    "Debt Collection",
    "Loan",
    "Money Transfer",
    "Other"
]

# =========================
# Initialize Groq LLM
# =========================

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

# =========================
# Text cleaning
# =========================

def clean(text):

    text = text.lower()
    text = re.sub(r"[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()

# =========================
# Rule-based corrections
# =========================

def rule_based_category(text):

    # Loan related keywords
    if any(word in text for word in [
        "emi", "installment", "repayment", "loan payment",
        "interest rate", "loan balance"
    ]):
        return "Loan"

    # Credit card related
    if any(word in text for word in [
        "credit card", "card charge", "card payment", "unauthorized charge"
    ]):
        return "Credit Card"

    # Money transfer
    if any(word in text for word in [
        "upi", "transfer", "sent money", "payment failed", "transaction failed"
    ]):
        return "Money Transfer"

    return None


# =========================
# Predict complaint category
# =========================

def predict_category(text):

    # First try rule-based detection
    rule_category = rule_based_category(text)

    if rule_category:
        return rule_category

    # Otherwise use BERT model
    inputs = tokenizer(
        text,
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
# Generate response with LLaMA
# =========================

def generate_response(user_text, category):

    prompt = f"""
        You are an experienced banking customer support assistant working for a bank.

        Your job is to help customers understand and resolve their banking complaints.

        Customer Complaint:
        {user_text}

        Detected Issue Category:
        {category}

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

        Write the response as if you are a real banking support agent.
"""

    chat = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}]
    )

    return chat.choices[0].message.content


# =========================
# Chat loop
# =========================

print("\n🏦 AI Banking Complaint Assistant")
print("Type 'exit' to quit.\n")

while True:

    user_input = input("You: ")

    if user_input.lower() == "exit":
        print("Bot: Thank you for contacting support. Goodbye.")
        break

    clean_text = clean(user_input)

    category = predict_category(clean_text)

    response = generate_response(user_input, category)

    print(f"\nDetected Issue: {category}")
    print(f"\nBot: {response}\n")