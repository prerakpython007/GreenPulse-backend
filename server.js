const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your React app to connect
app.use(express.json()); // Parses JSON bodies

// Connect to MongoDB (You'll get this URL from MongoDB Atlas)
const uri = process.env.ATLAS_URI;
mongoose.connect(uri);
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

// Define a Schema and Model for your data
const sensorDataSchema = new mongoose.Schema({
  sensorId: String,
  temperature: Number,
  humidity: Number,
  soilMoisture: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);

// Create an API endpoint for the ESP32 to POST data to
app.post('/api/sensorData', async (req, res) => {
  try {
    const newData = new SensorData(req.body);
    await newData.save();
    res.status(201).json({ message: 'Data saved successfully!' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create an API endpoint for the React app to GET data from
app.get('/api/sensorData', async (req, res) => {
  try {
    // Get the latest 100 readings, sorted by newest first
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});