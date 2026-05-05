import os
import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import matplotlib
matplotlib.use('Agg') # Set backend to non-interactive to avoid main thread issues in Flask
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Ensure the plots directory exists
PLOT_DIR = os.path.join(os.path.dirname(__file__), 'static', 'images', 'shap_plots')
os.makedirs(PLOT_DIR, exist_ok=True)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'dataset', 'sample_data.csv')

# Global variables to hold model and explainer
_model = None
_explainer = None
_feature_names = ['age', 'income', 'loan', 'credit']

def _load_data():
    df = pd.read_csv(DATA_PATH)
    X = df[_feature_names]
    y = df['approved']
    return X, y

def train_model():
    global _model, _explainer
    X, y = _load_data()
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    _model = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss')
    _model.fit(X_train, y_train)
    
    y_pred = _model.predict(X_test)
    y_prob = _model.predict_proba(X_test)[:, 1]
    
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1": float(f1_score(y_test, y_pred)),
        "auc": float(roc_auc_score(y_test, y_prob)),
        "samples": int(len(X))
    }
    
    # SHAP explainer - optimized using a sample of the data
    _explainer = shap.TreeExplainer(_model)
    
    # Calculate global SHAP values on a random sample to make it much faster
    X_train_sample = shap.sample(X_train, 500)
    shap_values = _explainer(X_train_sample)
    
    # Summary plot
    plt.figure()
    shap.summary_plot(shap_values, X_train_sample, show=False)
    plt.savefig(os.path.join(PLOT_DIR, 'summary.png'), bbox_inches='tight')
    plt.close()
    
    # Dependence plot
    plt.figure()
    shap.dependence_plot("income", shap_values.values, X_train_sample, show=False)
    plt.savefig(os.path.join(PLOT_DIR, 'dependence.png'), bbox_inches='tight')
    plt.close()
    
    return metrics

def predict_and_explain(features):
    global _model, _explainer
    
    if _model is None or _explainer is None:
        train_model()
        
    df = pd.DataFrame([features])
    df = df[_feature_names]
    
    prob = float(_model.predict_proba(df)[0, 1])
    pred = int(_model.predict(df)[0])
    
    shap_vals = _explainer(df)
    
    # Save local waterfall plot
    plt.figure()
    shap.plots.waterfall(shap_vals[0], show=False)
    waterfall_path = f'/static/images/shap_plots/waterfall_{np.random.randint(1000)}.png'
    full_path = os.path.join(os.path.dirname(__file__), waterfall_path.lstrip('/'))
    plt.savefig(full_path, bbox_inches='tight')
    plt.close()
    
    shap_breakdown = []
    values = shap_vals[0].values
    data = shap_vals[0].data
    
    improvements = []
    for i, feature in enumerate(_feature_names):
        impact = values[i]
        impact_dir = "positive" if impact > 0 else "negative"
        label_str = feature.capitalize()
        
        reason_str = f"Significantly influenced the decision"
        if feature == 'income': reason_str = f"Annual income of ${data[i]:,.0f}"
        elif feature == 'loan': reason_str = f"Requested loan amount of ${data[i]:,.0f}"
        elif feature == 'credit': reason_str = f"Credit score of {data[i]:.0f}"
        elif feature == 'age': reason_str = f"Applicant age: {data[i]:.0f} years"

        shap_breakdown.append({
            "label": label_str,
            "direction": impact_dir,
            "impact": abs(float(impact)),
            "reason": reason_str
        })
        
        if impact < 0:
            if feature == 'income': 
                improvements.append({"label": "Income Verification", "tip": "Consider increasing your verified income sources.", "priority": "high"})
            elif feature == 'loan': 
                improvements.append({"label": "Loan Amount", "tip": "A lower requested loan amount would reduce risk.", "priority": "medium"})
            elif feature == 'credit': 
                improvements.append({"label": "Credit Score", "tip": "Work on building a higher credit score.", "priority": "high"})
    
    if len(improvements) == 0 and pred == 0:
        improvements.append({"label": "General Profile", "tip": "Overall profile needs strengthening across multiple factors.", "priority": "high"})
    elif len(improvements) == 0 and pred == 1:
        improvements.append({"label": "Maintain Profile", "tip": "Excellent profile. Keep maintaining good financial health.", "priority": "low"})
        
    return {
        "status": "Approved" if pred == 1 else "Rejected",
        "probability": prob,
        "plots": {"waterfall": waterfall_path},
        "shap_breakdown": shap_breakdown,
        "improvements": improvements
    }
