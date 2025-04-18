const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const validations = require('../middleware/validate');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validations.registerUser, authController.register);

// @route   POST /api/auth/login
// @desc    Login user and get token
// @access  Public
router.post('/login', validations.loginUser, authController.login);

// @route   GET /api/auth/user
// @desc    Get authenticated user
// @access  Private
router.get('/user', auth, authController.getUser);

module.exports = router; 