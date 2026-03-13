# Complaint Compass 🧭

Complaint Compass is an advanced banking complaint analysis and management platform. It leverages state-of-the-art Natural Language Processing (NLP) to automate complaint categorization, sentiment analysis, and root-cause identification, providing an "Incident Command Center" for banking operations.

## 🏗️ Architecture

```mermaid
graph TD
    User([User]) --> Frontend[React Frontend]
    Frontend <--> API[Flask Backend]
    API <--> DB[(PostgreSQL)]
    
    subgraph AI/ML Layer
        API --> BERT[Local BERT Model]
        API <--> Groq[Groq LLaMA API]
    end
    
    BERT -.-> |Predict Category| API
    Groq -.-> |Sentiment, Priority, Root Cause, Response| API
```

## ✨ Key Features

- **AI-Powered Categorization**: Local BERT model classifies complaints into banking categories (Loans, Credit Cards, etc.).
- **Intelligent Analysis**: Sentiment analysis, frustration scoring, and priority ranking powered by LLaMA (via Groq).
- **Incident Commander**: Real-time clustering of related complaints to identify systemic issues and suggest resolutions.
- **AI Assistant**: A specialized banking support chatbot for resolving customer queries.
- **Root Cause Analysis**: Automated identification of underlying technical or process failures.
- **Interactive Dashboard**: Visual insights into complaint trends, geographical distribution, and resolution status.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL

### 2. Backend Setup

Navigate to the `backend` directory:
```sh
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### 📦 Download the ML Model
The system requires a pre-trained BERT model for classification. Download it and place it in the `backend/bert_complaint_model` directory.

- **Option 1 (Hugging Face):** [Ro706/complaint-bert-model](https://huggingface.co/Ro706/complaint-bert-model)
- **Option 2 (GitHub):** [ML Chatbot Releases](https://github.com/Ro706/mlchatbot/releases/tag/Model)

Ensure the structure looks like this:
`backend/bert_complaint_model/config.json`, `pytorch_model.bin`, etc.

#### Configure Environment
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/complaint_compass
JWT_SECRET_KEY=your_secret_key_here
GROQ_API_KEY=your_groq_api_key_here
```

#### Initialize Database
```sh
flask db upgrade
python seed.py
python app.py
```

### 3. Frontend Setup

In the root project directory:
```sh
npm install
```

Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000
```

Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:8080`.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui.
- **Backend**: Python, Flask, SQLAlchemy, PostgreSQL.
- **AI/ML**:
  - **BERT**: Fine-tuned for banking complaint classification (Local).
  - **LLaMA 3.1**: Used via Groq for high-speed reasoning and response generation.
  - **Transformers & PyTorch**: For model inference.

## 📄 License
This project is licensed under the MIT License.
