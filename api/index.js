const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection - use environment variable from Vercel
const uri = process.env.MONGODB_URI;

console.log('🔗 Connecting to MongoDB...');

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once('open', () => {
  console.log("✅ MongoDB database connection established successfully");
});

connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Define a Schema and Model for your data
const sensorDataSchema = new mongoose.Schema({
  sensorId: String,
  temperature: Number,
  humidity: Number,
  soilMoisture: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: '🌱 Plant Monitor Backend is running!',
    endpoints: [
      'POST /api/sensorData - For ESP32 to send data',
      'GET /api/sensorData - For React app to get data',
      'GET /api/health - Health check'
    ]
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.json({ 
      status: 'OK', 
      database: dbStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create an API endpoint for the ESP32 to POST data to
app.post('/api/sensorData', async (req, res) => {
  try {
    console.log('📨 Received sensor data:', req.body);
    
    const newData = new SensorData(req.body);
    await newData.save();
    
    console.log('✅ Data saved to MongoDB');
    res.status(201).json({ message: 'Data saved successfully!' });
  } catch (error) {
    console.error('❌ Error saving data:', error);
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

// Export the app for Vercel
module.exports = app;