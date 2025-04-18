const path = require('path');
const Database = require('better-sqlite3');

// Create database connection
const db = new Database(path.join(__dirname, '../database.sqlite'), { verbose: console.log });

// Initialize database with tables if they don't exist
const initializeDatabase = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Campaigns table
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      goal_amount REAL NOT NULL,
      image_path TEXT,
      created_by INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Donations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      donor_name TEXT NOT NULL,
      amount REAL NOT NULL,
      donated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    )
  `);

  console.log('Database initialized with required tables');

  // Insert sample data if the database is empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    insertSampleData();
  }
};

// Insert sample data for testing
const insertSampleData = () => {
  // Insert a sample user
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password) VALUES (?, ?, ?)
  `);
  
  // Use a pre-hashed version of 'password123' for the demo user
  const hashedPassword = '$2b$10$HMJlHO0xnBuUKVEYZwXRWOCZEIVzXJJfNeBj3CAuLbzGElmrDcVTm';
  
  const userId = insertUser.run('Demo User', 'demo@example.com', hashedPassword).lastInsertRowid;

  // Insert sample campaigns
  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (title, description, goal_amount, image_path, created_by)
    VALUES (?, ?, ?, ?, ?)
  `);

  const campaignId1 = insertCampaign.run(
    'Education for Children',
    'Help us provide educational materials for underprivileged children.',
    5000,
    '/uploads/sample-campaign-1.jpg',
    userId
  ).lastInsertRowid;

  const campaignId2 = insertCampaign.run(
    'Clean Water Initiative',
    'Support our mission to bring clean water to rural communities.',
    10000,
    '/uploads/sample-campaign-2.jpg',
    userId
  ).lastInsertRowid;

  // Insert sample donations
  const insertDonation = db.prepare(`
    INSERT INTO donations (campaign_id, donor_name, amount)
    VALUES (?, ?, ?)
  `);

  insertDonation.run(campaignId1, 'Anonymous Donor', 500);
  insertDonation.run(campaignId1, 'John Smith', 250);
  insertDonation.run(campaignId2, 'Jane Doe', 1000);

  console.log('Sample data inserted successfully');
};

// Initialize database on module load
initializeDatabase();

module.exports = db; 