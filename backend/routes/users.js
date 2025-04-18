const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const auth = require('../middleware/auth');

// @route   GET /api/users/campaigns
// @desc    Get all campaigns created by the authenticated user
// @access  Private
router.get('/campaigns', auth, userController.getUserCampaigns);

module.exports = router; 