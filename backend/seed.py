from app import app
from models import db, User, Complaint
import uuid

def seed():
    with app.app_context():
        # Create tables
        db.create_all()
        
        # Create public user for anonymous submissions
        public_user_id = "00000000-0000-0000-0000-000000000000"
        if not User.query.get(public_user_id):
            public_user = User(id=public_user_id, email="public@example.com")
            public_user.set_password("public_placeholder_pass")
            db.session.add(public_user)
            print(f"Created public user: {public_user_id}")

        # Create admin user if not exists
        admin_email = "admin@example.com"
        if not User.query.filter_by(email=admin_email).first():
            admin = User(email=admin_email)
            admin.set_password("admin123")
            db.session.add(admin)
            print(f"Created admin user: {admin_email}")
        
        # Add sample data if empty
        if not Complaint.query.first():
            user = User.query.filter_by(email=admin_email).first()
            sample_complaint = Complaint(
                user_id=user.id,
                complaint_text="My ATM transaction failed but money was deducted from my account.",
                category="ATM",
                sentiment="negative",
                frustration_score=8,
                priority_score=85,
                status="new",
                product_type="ATM",
                location="Mumbai"
            )
            db.session.add(sample_complaint)
            print("Added sample complaint")
            
        db.session.commit()
        print("Seeding completed successfully")

if __name__ == "__main__":
    seed()
