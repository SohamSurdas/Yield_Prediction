from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import traceback
import json

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests, e.g., from http://localhost:3000

# Load the trained model
model = joblib.load("crop_yield_model.pkl")

# Load the model columns saved during training
with open("model_columns.json", "r") as f:
    model_columns = json.load(f)

# A simple mapping for state climate data (can be enhanced)
states_climate = {
    "Punjab":         {"AvgTemperature(C)": 25, "AnnualRainfall(mm)": 650},
    "Haryana":        {"AvgTemperature(C)": 26, "AnnualRainfall(mm)": 600},
    "Uttar Pradesh":  {"AvgTemperature(C)": 27, "AnnualRainfall(mm)": 900},
    "Maharashtra":    {"AvgTemperature(C)": 28, "AnnualRainfall(mm)": 1000},
    "West Bengal":    {"AvgTemperature(C)": 29, "AnnualRainfall(mm)": 1500},
}

@app.route('/')
def home():
    return "Flask server is running."

@app.route('/predict', methods=['POST'])
def predict():
    """
    Expects JSON data:
    {
      "cropType": "Rice",
      "landSize": 5.0,
      "fertilizer": 100.0,
      "pesticide": 10.0,
      "latitude": 30.7333,
      "longitude": 76.7794,
      "state": "Punjab"
    }
    """
    # For debugging: print raw and parsed data
    print("Raw request data:", request.data)
    data = request.json
    print("Parsed JSON data:", data)
    
    if not data:
        return jsonify({"error": "No JSON payload received"}), 400

    # Utility function for safe float conversion
    def safe_float(value):
        try:
            return float(value)
        except:
            return 0.0

    # Extract and convert the input fields
    crop_type    = data.get("cropType", "")
    land_size    = safe_float(data.get("landSize"))
    fertilizer   = safe_float(data.get("fertilizer"))
    pesticide    = safe_float(data.get("pesticide"))
    latitude     = safe_float(data.get("latitude"))
    longitude    = safe_float(data.get("longitude"))
    state        = data.get("state", "")

    # Get typical climate data based on state; default if not found
    if state in states_climate:
        avg_temp = states_climate[state]["AvgTemperature(C)"]
        annual_rainfall = states_climate[state]["AnnualRainfall(mm)"]
    else:
        avg_temp = 25
        annual_rainfall = 700

    # Build the input dictionary for the model (ensure keys match training)
    input_dict = {
        "Year": [2024],  # Or use another value if needed
        "LandSize(ha)": [land_size],
        "FertilizerUsage(kg_ha)": [fertilizer],
        "PesticideUsage(kg_ha)": [pesticide],
        "AvgTemperature(C)": [avg_temp],
        "AnnualRainfall(mm)": [annual_rainfall],
        "State_Haryana": [1 if state == "Haryana" else 0],
        "State_Maharashtra": [1 if state == "Maharashtra" else 0],
        "State_Punjab": [1 if state == "Punjab" else 0],
        "State_Uttar Pradesh": [1 if state == "Uttar Pradesh" else 0],
        "State_West Bengal": [1 if state == "West Bengal" else 0],
        "CropType_Rice": [1 if crop_type == "Rice" else 0],
        "CropType_Wheat": [1 if crop_type == "Wheat" else 0],
        "CropType_Maize": [1 if crop_type == "Maize" else 0]
    }

    # Create a DataFrame from the input dictionary
    input_df = pd.DataFrame(input_dict)
    
    # Reorder the columns to match the training set
    try:
        input_df = input_df[model_columns]
    except Exception as e:
        print("Column mismatch error:", e)
        return jsonify({"error": f"Column mismatch: {str(e)}"}), 400

    print("Input DataFrame:\n", input_df)

    # Make prediction using the trained model
    try:
        prediction = model.predict(input_df)[0]
        return jsonify({"predicted_yield": round(float(prediction), 2)})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
