const Donation = require('../models/donation');
const Campaign = require('../models/campaign');
const db = require('../models/db');

// Create a new donation
exports.createDonation = (req, res) => {
  try {
    const { campaign_id, donor_name, amount } = req.body;
    
    // Check if campaign exists
    const campaign = Campaign.getById(campaign_id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Create donation
    const donation = Donation.create({
      campaign_id,
      donor_name,
      amount
    });
    
    res.status(201).json(donation);
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ error: 'Server error creating donation' });
  }
};

// Get campaign donation summary
exports.getCampaignSummary = (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if campaign exists
    const campaign = Campaign.getById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const summary = Donation.getCampaignSummary(id);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching donation summary:', error);
    res.status(500).json({ error: 'Server error fetching donation summary' });
  }
};

// Get recent donations for a campaign
exports.getRecentDonations = (req, res) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    
    // Check if campaign exists
    const campaign = Campaign.getById(id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const donations = Donation.getRecentDonations(id, limit);
    res.json(donations);
  } catch (error) {
    console.error('Error fetching recent donations:', error);
    res.status(500).json({ error: 'Server error fetching recent donations' });
  }
};

// Get total amount raised across all campaigns
exports.getTotalRaised = (req, res) => {
  try {
    const total = Donation.getTotalRaised();
    res.json({ total });
  } catch (error) {
    console.error('Error getting total raised:', error);
    res.status(500).json({ error: 'Server error getting total raised' });
  }
};

// Get overall statistics (total raised, donation count, active campaigns)
exports.getStatistics = async (req, res) => {
  try {
    // Get total amount raised
    const totalRaised = Donation.getTotalRaised();
    
    // Get donation count
    const stmt = db.prepare('SELECT COUNT(*) as count FROM donations');
    const donationCount = stmt.get().count;
    
    // Get all campaigns count - no status filtering for now
    const campaignStmt = db.prepare('SELECT COUNT(*) as count FROM campaigns');
    const campaignCount = campaignStmt.get().count;
    
    res.json({
      totalRaised,
      donationCount,
      campaignCount,
      timestamp: Date.now() // Add timestamp to prevent caching
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({ error: 'Server error getting statistics' });
  }
}; 