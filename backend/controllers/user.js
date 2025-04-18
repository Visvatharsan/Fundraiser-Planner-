const User = require('../models/user');

// Get all campaigns created by the authenticated user
exports.getUserCampaigns = (req, res) => {
  try {
    const campaigns = User.getUserCampaigns(req.user.id);
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching user campaigns:', error);
    res.status(500).json({ error: 'Server error fetching user campaigns' });
  }
}; 