import pandas as pd
import numpy as np
import re

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

from datasets import Dataset

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)

# =========================
# Load Dataset
# =========================

df = pd.read_csv("complaints.csv", low_memory=False)

df = df[["Consumer complaint narrative", "Product"]]

df.columns = ["complaint_text", "product"]

df = df.dropna()

print("Dataset size:", df.shape)


# =========================
# Reduce dataset for speed
# =========================

df = df.sample(60000, random_state=42)


# =========================
# Map product categories
# =========================

def map_product(product):

    product = product.lower()

    if "credit card" in product or "prepaid" in product:
        return "Credit Card"

    if "loan" in product or "mortgage" in product:
        return "Loan"

    if "money transfer" in product or "virtual currency" in product:
        return "Money Transfer"

    if "account" in product:
        return "Account Services"

    if "debt" in product:
        return "Debt Collection"

    if "credit reporting" in product:
        return "Credit Reporting"

    return "Other"


df["product"] = df["product"].apply(map_product)

print("\nCategory distribution:")
print(df["product"].value_counts())


# =========================
# Encode labels
# =========================

label_encoder = LabelEncoder()

df["label"] = label_encoder.fit_transform(df["product"])

num_labels = len(label_encoder.classes_)

print("\nClasses:", label_encoder.classes_)


# =========================
# Train Test Split
# =========================

train_df, test_df = train_test_split(
    df,
    test_size=0.2,
    stratify=df["label"],
    random_state=42
)


# =========================
# Convert to HuggingFace dataset
# =========================

train_dataset = Dataset.from_pandas(train_df)
test_dataset = Dataset.from_pandas(test_df)


# =========================
# Load tokenizer
# =========================

model_name = "distilbert-base-uncased"

tokenizer = AutoTokenizer.from_pretrained(model_name)


def tokenize(batch):

    return tokenizer(
        batch["complaint_text"],
        padding="max_length",
        truncation=True,
        max_length=256
    )


train_dataset = train_dataset.map(tokenize, batched=True)
test_dataset = test_dataset.map(tokenize, batched=True)


train_dataset.set_format(
    type="torch",
    columns=["input_ids", "attention_mask", "label"]
)

test_dataset.set_format(
    type="torch",
    columns=["input_ids", "attention_mask", "label"]
)


# =========================
# Load model
# =========================

model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=num_labels
)


# =========================
# Metrics
# =========================

def compute_metrics(eval_pred):

    logits, labels = eval_pred

    predictions = np.argmax(logits, axis=1)

    acc = accuracy_score(labels, predictions)

    return {"accuracy": acc}


# =========================
# Training arguments
# =========================

training_args = TrainingArguments(

    output_dir="./results",

    learning_rate=2e-5,

    per_device_train_batch_size=8,

    per_device_eval_batch_size=8,

    num_train_epochs=3,

    logging_dir="./logs",

    save_total_limit=1
)


# =========================
# Trainer
# =========================

trainer = Trainer(

    model=model,

    args=training_args,

    train_dataset=train_dataset,

    eval_dataset=test_dataset,

    tokenizer=tokenizer,

    compute_metrics=compute_metrics
)


# =========================
# Train model
# =========================

trainer.train()


# =========================
# Evaluate
# =========================

results = trainer.evaluate()

print("\nFinal Accuracy:", results["eval_accuracy"])


# =========================
# Save model
# =========================

trainer.save_model("bert_complaint_model")

print("\nModel saved.")