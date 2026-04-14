const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  getComplaint,
  updateComplaint,
  deleteComplaint,
  assignComplaint,
  submitFeedback,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/', protect, upload.single('image'), createComplaint);
router.get('/', protect, getComplaints);
router.get('/:id', protect, getComplaint);
router.put('/:id', protect, authorize('agent', 'admin'), updateComplaint);
router.put('/:id/assign', protect, authorize('admin'), assignComplaint);
router.delete('/:id', protect, authorize('admin'), deleteComplaint);
router.post('/:id/feedback', protect, authorize('user'), submitFeedback);

module.exports = router;
