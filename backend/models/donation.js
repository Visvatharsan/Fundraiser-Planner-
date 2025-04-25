const db = require('./db');

const Donation = {
  // Get all donations
  getAll: () => {
    const stmt = db.prepare(`
      SELECT d.*, c.title as campaign_title
      FROM donations d
      JOIN campaigns c ON d.campaign_id = c.id
      ORDER BY d.donated_at DESC
    `);
    
    return stmt.all();
  },
  
  // Create a new donation
  create: (donation) => {
    const { campaign_id, donor_name, amount } = donation;
    
    const stmt = db.prepare(`
      INSERT INTO donations (campaign_id, donor_name, amount)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(campaign_id, donor_name, amount);
    
    // Get the newly created donation with the database timestamp
    const newDonation = db.prepare(`
      SELECT * FROM donations WHERE id = ?
    `).get(result.lastInsertRowid);
    
    return newDonation;
  },
  
  // Get campaign donation summary
  getCampaignSummary: (campaignId) => {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as donation_count,
        COALESCE(SUM(amount), 0) as total_amount,
        MIN(amount) as min_donation,
        MAX(amount) as max_donation,
        AVG(amount) as avg_donation
      FROM donations
      WHERE campaign_id = ?
    `);
    
    return stmt.get(campaignId);
  },
  
  // Get recent donations for a campaign
  getRecentDonations: (campaignId, limit = 10) => {
    const stmt = db.prepare(`
      SELECT * FROM donations
      WHERE campaign_id = ?
      ORDER BY donated_at DESC
      LIMIT ?
    `);
    
    return stmt.all(campaignId, limit);
  },
  
  // Get total amount donated to all campaigns
  getTotalRaised: () => {
    try {
      const stmt = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM donations');
      const result = stmt.get();
      return result ? result.total : 0;
    } catch (error) {
      console.error('Error getting total raised:', error);
      return 0;
    }
  }
};

module.exports = Donation; 