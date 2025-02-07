import React, { useState, useEffect } from 'react';

const YieldForm = () => {
  const [cropType, setCropType] = useState("Rice");
  const [landSize, setLandSize] = useState("");
  const [fertilizer, setFertilizer] = useState("");
  const [pesticide, setPesticide] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [predictedYield, setPredictedYield] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Get user's current lat/long from browser
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLatitude(position.coords.latitude.toFixed(4));
        setLongitude(position.coords.longitude.toFixed(4));
      }, () => {
        console.log("Could not get location");
      });
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setPredictedYield(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cropType: cropType,
          landSize: landSize,
          fertilizer: fertilizer,
          pesticide: pesticide,
          latitude: latitude,
          longitude: longitude,
          state: stateValue,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Request failed");
      }

      const data = await response.json();
      setPredictedYield(data.predicted_yield);
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg(error.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "20px auto" }}>
      <h2>Crop Yield Prediction</h2>
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: "4px" }}>
          Crop Type:
        </label>
        <select
          value={cropType}
          onChange={(e) => setCropType(e.target.value)}
          style={{ marginBottom: "12px", width: "100%" }}
        >
          <option value="Rice">Rice</option>
          <option value="Wheat">Wheat</option>
          <option value="Maize">Maize</option>
        </select>

        <label style={{ display: "block", marginBottom: "4px" }}>
          Land Size (ha):
        </label>
        <input
          type="number"
          step="0.1"
          value={landSize}
          onChange={(e) => setLandSize(e.target.value)}
          required
          style={{ marginBottom: "12px", width: "100%" }}
        />

        <label style={{ display: "block", marginBottom: "4px" }}>
          Fertilizer (kg/ha):
        </label>
        <input
          type="number"
          step="0.1"
          value={fertilizer}
          onChange={(e) => setFertilizer(e.target.value)}
          required
          style={{ marginBottom: "12px", width: "100%" }}
        />

        <label style={{ display: "block", marginBottom: "4px" }}>
          Pesticide (kg/ha):
        </label>
        <input
          type="number"
          step="0.1"
          value={pesticide}
          onChange={(e) => setPesticide(e.target.value)}
          required
          style={{ marginBottom: "12px", width: "100%" }}
        />

        <label style={{ display: "block", marginBottom: "4px" }}>
          Latitude:
        </label>
        <input
          type="number"
          step="0.0001"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          required
          style={{ marginBottom: "12px", width: "100%" }}
        />

        <label style={{ display: "block", marginBottom: "4px" }}>
          Longitude:
        </label>
        <input
          type="number"
          step="0.0001"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          required
          style={{ marginBottom: "12px", width: "100%" }}
        />

        <label style={{ display: "block", marginBottom: "4px" }}>
          State:
        </label>
        <select
          value={stateValue}
          onChange={(e) => setStateValue(e.target.value)}
          style={{ marginBottom: "12px", width: "100%" }}
        >
          <option value="">Select State</option>
          <option value="Punjab">Punjab</option>
          <option value="Haryana">Haryana</option>
          <option value="Uttar Pradesh">Uttar Pradesh</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="West Bengal">West Bengal</option>
        </select>

        <button type="submit" style={{ display: "block", marginTop: "12px" }}>
          Predict Yield
        </button>
      </form>

      {errorMsg && (
        <div style={{ color: "red", marginTop: "12px" }}>
          <strong>Error: </strong>{errorMsg}
        </div>
      )}
      {predictedYield && (
        <div style={{ marginTop: "12px" }}>
          <h3>Predicted Yield: {predictedYield} kg/ha</h3>
        </div>
      )}
    </div>
  );
};

export default YieldForm;
