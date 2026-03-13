# Complaint Compass

Complaint Compass is a banking complaint analysis and management platform featuring an AI-powered assistant, automated root-cause analysis, and an incident command center for handling and routing customer complaints.

## Architecture

This project is structured as a full-stack application:
- **Frontend**: React + TypeScript + Vite, using Tailwind CSS and shadcn/ui.
- **Backend**: Python + Flask + PostgreSQL, featuring SQLAlchemy for ORM and Alembic for migrations.
- **AI Integration**: Powered directly by Google Gemini API (`gemini-2.5-flash` and `gemini-2.5-flash-lite`).

## Getting Started

### 1. Backend Setup

Navigate to the `backend` directory and install the requirements:

```sh
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/complaint_compass
JWT_SECRET_KEY=your_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key
```

Run the database setup and start the Flask server:

```sh
flask db upgrade
python seed.py
python app.py
```

### 2. Frontend Setup

In the root project directory, install the Node.js dependencies:

```sh
npm install
```

Create a `.env` file in the root project directory:

```env
VITE_API_URL=http://localhost:5000
```

Start the Vite development server:

```sh
npm run dev
```

The application will be available at `http://localhost:8080`.
