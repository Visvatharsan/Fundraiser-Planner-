const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donation');
const validations = require('../middleware/validate');

// @route   POST /api/donations
// @desc    Create a new donation
// @access  Public
router.post('/', validations.createDonation, donationController.createDonation);

// @route   GET /api/donations/campaigns/:id/summary
// @desc    Get donation summary for a campaign
// @access  Public
router.get('/campaigns/:id/summary', donationController.getCampaignSummary);

// @route   GET /api/donations/campaigns/:id/recent
// @desc    Get recent donations for a campaign
// @access  Public
router.get('/campaigns/:id/recent', donationController.getRecentDonations);

// @route   GET /api/donations/total
// @desc    Get total amount raised across all campaigns
// @access  Public
router.get('/total', donationController.getTotalRaised);

// Get overall statistics
router.get('/statistics', donationController.getStatistics);

module.exports = router; 