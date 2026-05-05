# 🧠 Interpretable AI & Model Explainability Framework

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Backend-Flask-lightgrey.svg)](https://flask.palletsprojects.com/)
[![XGBoost](https://img.shields.io/badge/Model-XGBoost-orange.svg)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/Explainability-SHAP-success.svg)](https://shap.readthedocs.io/)
[![Modern UI](https://img.shields.io/badge/UI-Glassmorphism-purple.svg)](https://lucide.dev/)
[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-PythonAnywhere-blue?style=for-the-badge&logo=python&logoColor=white)](https://shabber.pythonanywhere.com)

---

## 🌐 Live Demo

> **▶️ [Click here to try the Live Demo](https://shabber.pythonanywhere.com)**
>
> Hosted on [PythonAnywhere](https://www.pythonanywhere.com) — no installation needed. Just open and explore!

---

A premium, full-stack platform for **Explainable AI (XAI)**. This framework predicts loan approvals using high-performance Gradient Boosting (XGBoost) and provides deep model interpretability using **SHAP (SHapley Additive exPlanations)**.

## ✨ Core Features

*   **⚡ Professional Dashboard**: A high-end Single Page Application (SPA) built with a modern "Cyber-Dark" Glassmorphism design system.
*   **📊 Deep Interpretability**: 
    *   **Local Explanations**: Waterfall plots explaining individual prediction factors.
    *   **Global Insights**: Beeswarm summary and Feature Dependence plots for aggregate model logic.
*   **📈 Real-time Analytics**: Live calculation of Accuracy, precision, recall, and ROC AUC metrics during model lifecycle events.
*   **🔔 System Feedback**: Integrated notification system, toast alerts, and a dynamic search engine for seamless interaction.
*   **🛠️ Robust Backend**: Flask-powered API with predictive logic and automated SHAP value computation.

## 🛠️ Technology Stack

*   **Frontend**: HTML5, Vanilla CSS (Design Tokens), Javascript (ES6+), Lucide Icons.
*   **Backend**: Python 3.12, Flask, Pandas, NumPy.
*   **Machine Learning**: XGBoost Classifier, Scikit-Learn.
*   **Interpretability**: SHAP (Kernel Explainer).

---

## 🚀 Installation & Setup

Follow these steps to get the environment running on your local machine.

### 1. Prerequisites
Ensure you have **Python 3.12** installed on your Windows system.

### 2. Clone and Navigate
```powershell
cd "Interpretable AI & Model Explainability Framework Using SHAP frontend"
```

### 3. Create a Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\activate
```

### 4. Install Dependencies
```powershell
pip install pandas==2.2.3 flask xgboost shap matplotlib scikit-learn
```
> [!NOTE]
> `pandas` is pinned to `2.2.3` for maximum stability and compatibility with local environment policies.

---

## 🕹️ Running the Application

### 1. Generate Sample Data (Initial Setup only)
```powershell
python generate_data.py
```

### 2. Start the Server
```powershell
python app.py
```

### 3. Access the Dashboard
Open your browser and navigate to:
**[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📖 Usage Guide

1.  **Model Training**: Navigate to the **Model Training** section and click **"Initiate Training"**. This fits the XGBoost model and pre-calculates global SHAP values.
2.  **Prediction Engine**: Go to the **Predictions** tab. Enter values for Age, Income, Loan Amount, and Credit Score.
3.  **Explainability Lab**: After predicting, the system automatically redirects you to the **Explanations** tab to show the **Waterfall Plot**, detailing exactly why the model made its decision.

---

## 📁 Project Structure

```text
├── app.py              # Flask API & Routing
├── model.py            # ML Logic & SHAP Computation
├── generate_data.py    # Synthetic Dataset Generation
├── dataset/            # CSV Storage
├── static/
│   ├── css/            # Cyber-Dark Design System
│   ├── js/             # SPA Router & Logic
│   └── images/         # Generated SHAP Plots
└── templates/
    └── index.html      # Main Dashboard Entry
```

---

## 📜 License
Developed as a premium AI Explainability portfolio project. Designed for high-density information display and state-of-the-art UX.
