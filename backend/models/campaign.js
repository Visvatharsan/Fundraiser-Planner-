const db = require('./db');

const Campaign = {
  // Get all campaigns with donation statistics
  getAll: () => {
    const stmt = db.prepare(`
      SELECT c.*, 
        (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE campaign_id = c.id) as raised_amount,
        (SELECT COUNT(*) FROM donations WHERE campaign_id = c.id) as donation_count,
        u.name as creator_name
      FROM campaigns c
      JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `);
    
    return stmt.all();
  },
  
  // Get campaign by ID with donation statistics
  getById: (id) => {
    const stmt = db.prepare(`
      SELECT c.*, 
        (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE campaign_id = c.id) as raised_amount,
        (SELECT COUNT(*) FROM donations WHERE campaign_id = c.id) as donation_count,
        u.name as creator_name
      FROM campaigns c
      JOIN users u ON c.created_by = u.id
      WHERE c.id = ?
    `);
    
    return stmt.get(id);
  },
  
  // Create a new campaign
  create: (campaign) => {
    const { title, description, goal_amount, image_path, created_by } = campaign;
    
    const stmt = db.prepare(`
      INSERT INTO campaigns 
      (title, description, goal_amount, image_path, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(title, description, goal_amount, image_path, created_by);
    
    return {
      id: result.lastInsertRowid,
      ...campaign
    };
  },
  
  // Update an existing campaign
  update: (id, campaign) => {
    const { title, description, goal_amount, image_path } = campaign;
    
    let sql = 'UPDATE campaigns SET ';
    const params = [];
    
    if (title) {
      sql += 'title = ?, ';
      params.push(title);
    }
    
    if (description) {
      sql += 'description = ?, ';
      params.push(description);
    }
    
    if (goal_amount) {
      sql += 'goal_amount = ?, ';
      params.push(goal_amount);
    }
    
    if (image_path) {
      sql += 'image_path = ?, ';
      params.push(image_path);
    }
    
    // Remove trailing comma and space
    sql = sql.slice(0, -2);
    
    sql += ' WHERE id = ?';
    params.push(id);
    
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    
    return result.changes > 0;
  },
  
  // Delete a campaign
  delete: (id) => {
    // First delete all donations related to this campaign
    const deleteRelatedDonations = db.prepare('DELETE FROM donations WHERE campaign_id = ?');
    deleteRelatedDonations.run(id);
    
    // Then delete the campaign
    const stmt = db.prepare('DELETE FROM campaigns WHERE id = ?');
    const result = stmt.run(id);
    
    return result.changes > 0;
  },
  
  // Get donations for a campaign
  getDonations: (campaignId) => {
    const stmt = db.prepare(`
      SELECT * FROM donations
      WHERE campaign_id = ?
      ORDER BY donated_at DESC
    `);
    
    return stmt.all(campaignId);
  }
};

module.exports = Campaign; 