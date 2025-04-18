const db = require('./db');
const bcrypt = require('bcrypt');

const User = {
  // Create a new user
  create: async (name, email, password) => {
    try {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Insert user into database
      const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
      const result = stmt.run(name, email, hashedPassword);
      
      return {
        id: result.lastInsertRowid,
        name,
        email
      };
    } catch (error) {
      throw error;
    }
  },
  
  // Find user by email
  findByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },
  
  // Find user by ID
  findById: (id) => {
    const stmt = db.prepare('SELECT id, name, email, date_created FROM users WHERE id = ?');
    return stmt.get(id);
  },
  
  // Verify user password
  verifyPassword: async (password, hashedPassword) => {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw error;
    }
  },
  
  // Get all campaigns created by a user
  getUserCampaigns: (userId) => {
    const stmt = db.prepare(`
      SELECT c.*, 
        (SELECT COALESCE(SUM(amount), 0) FROM donations WHERE campaign_id = c.id) as raised_amount,
        (SELECT COUNT(*) FROM donations WHERE campaign_id = c.id) as donation_count
      FROM campaigns c
      WHERE c.created_by = ?
      ORDER BY c.created_at DESC
    `);
    
    return stmt.all(userId);
  }
};

module.exports = User; 