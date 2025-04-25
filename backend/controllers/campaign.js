const Campaign = require('../models/campaign');
const path = require('path');
const db = require('../models/db');

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

// Get campaign recommendations based on keyword/interests
exports.getCampaignRecommendations = (req, res) => {
  try {
    const { keywords } = req.query;
    
    if (!keywords || keywords.trim() === '') {
      // If no keywords provided, return most popular campaigns
      const stmt = db.prepare(`
        SELECT c.*, 
          (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE campaign_id = c.id) as raised_amount,
          (SELECT COUNT(*) FROM donations WHERE campaign_id = c.id) as donation_count,
          u.name as creator_name
        FROM campaigns c
        JOIN users u ON c.created_by = u.id
        ORDER BY donation_count DESC
        LIMIT 5
      `);
      
      const popularCampaigns = stmt.all();
      return res.json({ campaigns: popularCampaigns, type: 'popular' });
    }
    
    // Split keywords by commas or spaces
    const keywordArray = keywords.toLowerCase().split(/[,\s]+/).filter(k => k.trim() !== '');
    
    // Build a query to find campaigns matching any of the keywords
    // Search in title and description
    let searchSQL = `
      SELECT c.*, 
        (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE campaign_id = c.id) as raised_amount,
        (SELECT COUNT(*) FROM donations WHERE campaign_id = c.id) as donation_count,
        u.name as creator_name
      FROM campaigns c
      JOIN users u ON c.created_by = u.id
      WHERE `;
    
    const searchConditions = [];
    for (const keyword of keywordArray) {
      searchConditions.push(`(LOWER(c.title) LIKE '%${keyword}%' OR LOWER(c.description) LIKE '%${keyword}%')`);
    }
    
    searchSQL += searchConditions.join(' OR ');
    searchSQL += ` ORDER BY c.created_at DESC LIMIT 5`;
    
    const stmt = db.prepare(searchSQL);
    const matchingCampaigns = stmt.all();
    
    res.json({ campaigns: matchingCampaigns, type: 'recommended', keywords: keywordArray });
  } catch (error) {
    console.error('Error getting campaign recommendations:', error);
    res.status(500).json({ error: 'Server error fetching campaign recommendations' });
  }
};

// Get real-time statistics for the chatbot
exports.getChatbotStatistics = (req, res) => {
  try {
    // Get donation statistics
    const donationStats = db.prepare(`
      SELECT 
        COUNT(*) as total_donations,
        COALESCE(SUM(amount), 0) as total_raised,
        COALESCE(AVG(amount), 0) as average_donation,
        MAX(amount) as largest_donation
      FROM donations
    `).get();
    
    // Get campaign statistics
    const campaignStats = db.prepare(`
      SELECT
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE campaign_id = campaigns.id) >= goal_amount THEN 1 END) as successful_campaigns
      FROM campaigns
    `).get();
    
    // Get most active campaign categories (derive from campaign titles/descriptions)
    const campaigns = db.prepare(`SELECT title, description FROM campaigns`).all();
    const categoryKeywords = {
      medical: ['medical', 'health', 'hospital', 'treatment', 'surgery', 'cancer'],
      education: ['education', 'school', 'college', 'university', 'tuition', 'student'],
      community: ['community', 'neighborhood', 'local', 'town', 'city'],
      creative: ['creative', 'art', 'music', 'film', 'book', 'project'],
      nonprofit: ['nonprofit', 'charity', 'organization', 'foundation'],
      emergency: ['emergency', 'disaster', 'relief', 'crisis'],
      personal: ['personal', 'family', 'individual']
    };
    
    // Count categories
    const categoryCount = {};
    Object.keys(categoryKeywords).forEach(category => {
      categoryCount[category] = 0;
    });
    
    // Simple category detection based on keywords
    campaigns.forEach(campaign => {
      const text = (campaign.title + ' ' + campaign.description).toLowerCase();
      
      Object.keys(categoryKeywords).forEach(category => {
        const keywords = categoryKeywords[category];
        for (const keyword of keywords) {
          if (text.includes(keyword)) {
            categoryCount[category]++;
            break;
          }
        }
      });
    });
    
    // Get top categories
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    res.json({
      donation_stats: donationStats,
      campaign_stats: campaignStats,
      top_categories: topCategories,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting chatbot statistics:', error);
    res.status(500).json({ error: 'Server error fetching chatbot statistics' });
  }
}; 