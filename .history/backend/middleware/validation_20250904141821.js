// backend/middleware/validation.js
// Input validation middleware for consistent data validation

const { body, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      })),
      type: 'VALIDATION_ERROR'
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .trim()
    .isLength({ min: 8, max: 15 })
    .withMessage('Phone number must be between 8 and 15 characters')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Phone number can only contain digits, spaces, hyphens, plus signs, and parentheses'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('civilId')
    .optional()
    .isLength({ min: 8, max: 12 })
    .withMessage('Civil ID must be between 8 and 12 characters'),
  
  body('passportNumber')
    .optional()
    .isLength({ min: 6, max: 15 })
    .withMessage('Passport number must be between 6 and 15 characters'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Admin login validation
const validateAdminLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Course creation validation
const validateCourseCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Course name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a valid number'),
  
  handleValidationErrors
];

// Lecture creation validation
const validateLectureCreation = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Lecture title must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('category')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Category must not exceed 50 characters'),
  
  body('quality')
    .optional()
    .isIn(['720p', '1080p', '4K'])
    .withMessage('Quality must be 720p, 1080p, or 4K'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateAdminLogin,
  validateCourseCreation,
  validateLectureCreation,
  handleValidationErrors
};
