const express = require('express');
const router = express.Router();
const { register, login, getUser, updateProfile, updatePassword } = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);

router.get('/me', authMiddleware, getUser);
router.put('/profile', authMiddleware, updateProfile);
router.put('/password', authMiddleware, updatePassword);

module.exports = router;