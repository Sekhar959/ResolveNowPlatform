const express = require('express');
const router = express.Router();
const { getOverview, getTrends, getByCategory, getByPriority, getAgentPerformance } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/overview', protect,getOverview);
router.get('/trends', protect, authorize('admin'), getTrends);
router.get('/by-category', protect, authorize('admin'), getByCategory);
router.get('/by-priority', protect, authorize('admin'), getByPriority);
router.get('/agent-performance', protect, authorize('admin'), getAgentPerformance);

module.exports = router;
