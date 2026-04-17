'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;
