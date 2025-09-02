const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');

router.post('/', auth, async (req, res) => {
  const { courseName } = req.body;
  try {
    const enrollment = new Enrollment({
      user: req.user.id,
      courseName,
    });
    await enrollment.save();
    res.status(201).json({ message: 'Enrolled successfully', enrollment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id });
    res.json(enrollments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get enrollment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.json(enrollment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update enrollment status
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, progress, completedAt } = req.body;
    
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status, progress, completedAt },
      { new: true }
    );
    
    if (!updatedEnrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    res.json(updatedEnrollment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete enrollment
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedEnrollment = await Enrollment.findByIdAndDelete(req.params.id);
    
    if (!deletedEnrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get enrollment statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const totalEnrollments = await Enrollment.countDocuments({ user: req.user.id });
    const completedEnrollments = await Enrollment.countDocuments({ 
      user: req.user.id, 
      status: 'completed' 
    });
    const inProgressEnrollments = await Enrollment.countDocuments({ 
      user: req.user.id, 
      status: 'in-progress' 
    });
    
    res.json({
      total: totalEnrollments,
      completed: completedEnrollments,
      inProgress: inProgressEnrollments,
      completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;