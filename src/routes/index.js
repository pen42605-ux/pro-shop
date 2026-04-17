'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const healthController = require('../controllers/health.controller');
const authRoutes = require('./auth.routes');
const lineRoutes = require('./line.routes');

const router = express.Router();

router.get('/health', asyncHandler(healthController.health));
router.use('/auth', authRoutes);
router.use('/auth/line', lineRoutes);

module.exports = router;
