const express = require('express');
const dashboardRouter = express.Router();
const { getDashboardOverview } = require('../controllers/dashboardController');
const protect = require('../middleware/auth');

dashboardRouter.get('/', protect, getDashboardOverview);

module.exports = dashboardRouter;