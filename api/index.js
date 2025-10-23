const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['https://green-pulse-app.vercel.app/'], // Add your frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔗 Connecting to MongoDB...');

mongoose.connect(MONGODB_URI || 'mongodb+srv://preraksiddhpura_db_user:kCVVc5ZH0MoBRwjo@cluster0.xxxxx.mongodb.net/plantDB?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Error:', err));

// Sensor Data Schema
const sensorDataSchema = new mongoose.Schema({
  sensorId: String,
  temperature: Number,
  humidity: Number,
  soilMoisture: Number,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: '🌱 Plant Monitor API is running!',
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

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

app.post('/api/sensorData', async (req, res) => {
  try {
    console.log('📨 Received data:', req.body);
    
    const newData = new SensorData(req.body);
    await newData.save();
    
    res.status(201).json({ 
      message: 'Data saved successfully!',
      id: newData._id 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/sensorData', async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(50);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle preflight requests
app.options('*', cors());

module.exports = app;