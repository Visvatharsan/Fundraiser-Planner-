const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize the app
const app = express();

// Security middlewares
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false, // For development only
  crossOriginEmbedderPolicy: false // For development only
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Define API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/users', require('./routes/users'));

// Serve frontend for any other routes
app.get('*', (req, res) => {
  // Filter out API routes to prevent serving frontend for API calls
  if (!req.originalUrl.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Set port and start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the fundraiser application`);
}); 