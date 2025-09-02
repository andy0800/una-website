const express = require('express');
const router = express.Router();
const Course = require('../models/Course');

// Public endpoint to get all courses (for profile page)
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().select('_id name color');
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// Get course by ID
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Failed to fetch course' });
  }
});

// Create new course (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, description, duration, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Course name is required' });
    }
    
    const newCourse = new Course({
      name,
      description: description || '',
      duration: duration || '',
      color: color || '#007bff'
    });
    
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Failed to create course' });
  }
});

// Update course (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, duration, color } = req.body;
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { name, description, duration, color },
      { new: true }
    );
    
    if (!updatedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Failed to update course' });
  }
});

// Delete course (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    
    if (!deletedCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Failed to delete course' });
  }
});

// Get course enrollments
router.get('/:id/enrollments', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id })
      .populate('user', 'name phone')
      .populate('course', 'name');
    
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    res.status(500).json({ message: 'Failed to fetch enrollments' });
  }
});

// Get course progress
router.get('/:id/progress', async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ course: req.params.id });
    
    const progress = {
      totalEnrollments: enrollments.length,
      completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
      inProgressEnrollments: enrollments.filter(e => e.status === 'in-progress').length
    };
    
    res.json(progress);
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ message: 'Failed to fetch progress' });
  }
});

module.exports = router;