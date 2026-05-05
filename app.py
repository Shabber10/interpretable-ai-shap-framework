from flask import Flask, render_template, request, jsonify
import model
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/train', methods=['POST'])
def train():
    try:
        logger.info("Starting model training...")
        metrics = model.train_model()
        return jsonify({
            "success": True,
            "message": "Model trained successfully!",
            "metrics": metrics,
            "plots": {
                "summary": "/static/images/shap_plots/summary.png",
                "dependence": "/static/images/shap_plots/dependence.png"
            }
        })

    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        features = {
            'age': float(data.get('age', 0)),
            'income': float(data.get('income', 0)),
            'loan': float(data.get('loan', 0)),
            'credit': float(data.get('credit', 0))
        }
        
        logger.info(f"Received prediction request: {features}")
        result = model.predict_and_explain(features)
        return jsonify({
            "success":        True,
            "prediction":     result["status"],
            "probability":    result["probability"],
            "plots":          result["plots"],
            "shap_breakdown": result.get("shap_breakdown", []),
            "improvements":   result.get("improvements",   []),
        })
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

