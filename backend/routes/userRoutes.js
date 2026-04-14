const express = require('express');
const router = express.Router();
const { getAllUsers, getAgents, createAgent, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/agents', protect, authorize('admin'), getAgents);
router.post('/create-agent', protect, authorize('admin'), createAgent);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
