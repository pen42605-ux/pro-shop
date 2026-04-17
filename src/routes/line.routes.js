'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const lineController = require('../controllers/line.controller');

const router = express.Router();

router.get('/url', asyncHandler(lineController.lineAuthorizeUrl));
router.get('/callback', asyncHandler(lineController.lineCallback));

module.exports = router;
