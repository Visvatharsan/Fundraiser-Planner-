const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules
const validations = {
  // User registration validation
  registerUser: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email')
      .normalizeEmail(),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    
    checkValidation
  ],
  
  // Login validation
  loginUser: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please provide a valid email'),
    
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required'),
    
    checkValidation
  ],
  
  // Campaign validation
  createCampaign: [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
    
    body('goal_amount')
      .trim()
      .notEmpty().withMessage('Goal amount is required')
      .isFloat({ min: 1 }).withMessage('Goal amount must be a positive number'),
    
    checkValidation
  ],
  
  // Donation validation
  createDonation: [
    body('campaign_id')
      .trim()
      .notEmpty().withMessage('Campaign ID is required')
      .isInt({ min: 1 }).withMessage('Invalid campaign ID'),
    
    body('donor_name')
      .trim()
      .notEmpty().withMessage('Donor name is required')
      .isLength({ min: 2 }).withMessage('Donor name must be at least 2 characters'),
    
    body('amount')
      .trim()
      .notEmpty().withMessage('Amount is required')
      .isFloat({ min: 1 }).withMessage('Amount must be a positive number'),
    
    checkValidation
  ]
};

module.exports = validations; 