from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

class Complaint(db.Model):
    __tablename__ = 'complaints'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    complaint_text = db.Column(db.Text, nullable=False)
    date = db.Column(db.Date, default=datetime.utcnow().date)
    product_type = db.Column(db.String(100), default='General')
    channel = db.Column(db.String(100), default='Manual')
    location = db.Column(db.String(255), default='Unknown')
    category = db.Column(db.String(100))
    sentiment = db.Column(db.String(50))
    frustration_score = db.Column(db.Integer)
    priority_score = db.Column(db.Integer)
    escalation_risk = db.Column(db.Numeric(4, 2))
    status = db.Column(db.String(50), default='new')
    cluster_id = db.Column(db.String(100))
    duplicate_of = db.Column(db.String(36), db.ForeignKey('complaints.id'))
    ai_response_draft = db.Column(db.Text)
    ai_root_cause = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='info')
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id', ondelete='SET NULL'))
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = db.Column(db.String(36), db.ForeignKey('complaints.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(50), default='user')
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
