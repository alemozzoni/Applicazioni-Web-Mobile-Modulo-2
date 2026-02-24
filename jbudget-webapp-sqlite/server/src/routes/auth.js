const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required')
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required')
];

const updatePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

// Routes PUBBLICHE (no auth)
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);

// Routes PROTETTE (richiedono auth)
router.get('/me', auth, authController.getMe);
router.put('/profile', auth, updateProfileValidation, authController.updateProfile);
router.put('/password', auth, updatePasswordValidation, authController.updatePassword);
router.delete('/account', auth, authController.deleteAccount);

// ✅ NUOVE ROUTES
router.post('/logout', auth, authController.logout);          // Logout singolo
router.post('/logout-all', auth, authController.logoutAll);    // Logout tutti i dispositivi
router.get('/sessions', auth, authController.getSessions);     // Vedi sessioni attive

module.exports = router;