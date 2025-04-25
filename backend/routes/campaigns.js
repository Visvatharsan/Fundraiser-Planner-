const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign');
const validations = require('../middleware/validate');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   GET /api/campaigns
// @desc    Get all campaigns
// @access  Public
router.get('/', campaignController.getAllCampaigns);

// @route   GET /api/campaigns/chatbot/recommendations
// @desc    Get campaign recommendations based on keywords/interests
// @access  Public
router.get('/chatbot/recommendations', campaignController.getCampaignRecommendations);

// @route   GET /api/campaigns/chatbot/statistics
// @desc    Get real-time statistics for the chatbot
// @access  Public
router.get('/chatbot/statistics', campaignController.getChatbotStatistics);

// @route   GET /api/campaigns/:id
// @desc    Get a campaign by ID
// @access  Public
router.get('/:id', campaignController.getCampaign);

// @route   POST /api/campaigns
// @desc    Create a new campaign
// @access  Private
router.post(
  '/',
  auth,
  upload.single('image'),
  validations.createCampaign,
  campaignController.createCampaign
);

// @route   PUT /api/campaigns/:id
// @desc    Update a campaign
// @access  Private
router.put(
  '/:id',
  auth,
  upload.single('image'),
  campaignController.updateCampaign
);

// @route   DELETE /api/campaigns/:id
// @desc    Delete a campaign
// @access  Private
router.delete('/:id', auth, campaignController.deleteCampaign);

// @route   GET /api/campaigns/:id/donations
// @desc    Get donations for a campaign
// @access  Public
router.get('/:id/donations', campaignController.getCampaignDonations);

module.exports = router; 