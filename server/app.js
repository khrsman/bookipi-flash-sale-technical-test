const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Configure dotenv
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Export app
module.exports = app;
