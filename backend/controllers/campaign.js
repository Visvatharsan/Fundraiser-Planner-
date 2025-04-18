const Campaign = require('../models/campaign');
const path = require('path');

// Get all campaigns
exports.getAllCampaigns = (req, res) => {
  try {
    const campaigns = Campaign.getAll();
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Server error fetching campaigns' });
  }
};

// Get campaign by ID
exports.getCampaign = (req, res) => {
  try {
    const { id } = req.params;
    const campaign = Campaign.getById(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Server error fetching campaign' });
  }
};

// Create new campaign
exports.createCampaign = (req, res) => {
  try {
    const { title, description, goal_amount } = req.body;
    const created_by = req.user.id;
    
    // Handle file upload
    let image_path = null;
    if (req.file) {
      // Store the path relative to uploads directory
      image_path = `/uploads/${req.file.filename}`;
    }
    
    const campaign = Campaign.create({
      title,
      description,
      goal_amount,
      image_path,
      created_by
    });
    
    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Server error creating campaign' });
  }
};

// Update campaign
exports.updateCampaign = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, goal_amount } = req.body;
    
    // Check if campaign exists and user owns it
    const existingCampaign = Campaign.getById(id);
    
    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (existingCampaign.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this campaign' });
    }
    
    // Handle file upload if there's a new image
    let image_path = existingCampaign.image_path;
    if (req.file) {
      image_path = `/uploads/${req.file.filename}`;
    }
    
    const result = Campaign.update(id, {
      title,
      description,
      goal_amount,
      image_path
    });
    
    if (result) {
      return res.json({ message: 'Campaign updated successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to update campaign' });
    }
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Server error updating campaign' });
  }
};

// Delete campaign
exports.deleteCampaign = (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if campaign exists and user owns it
    const existingCampaign = Campaign.getById(id);
    
    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (existingCampaign.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this campaign' });
    }
    
    const result = Campaign.delete(id);
    
    if (result) {
      return res.json({ message: 'Campaign deleted successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to delete campaign' });
    }
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Server error deleting campaign' });
  }
};

// Get campaign donations
exports.getCampaignDonations = (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if campaign exists
    const campaign = Campaign.getById(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const donations = Campaign.getDonations(id);
    res.json(donations);
  } catch (error) {
    console.error('Error fetching campaign donations:', error);
    res.status(500).json({ error: 'Server error fetching campaign donations' });
  }
}; 