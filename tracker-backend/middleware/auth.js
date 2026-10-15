const user = require('../models/userModel.js');
const jwt = require('jsonwebtoken');

async function authMiddleware(req, res, next) {  
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.SEC_KEY || process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ success: false, message: 'Authentication is not configured on the server' });
        }
        const decoded = jwt.verify(token, secret);
        const foundUser = await user.findById(decoded.id).select('-password');
        
        if (!foundUser) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }
        
        req.user = foundUser.toObject();
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
} 

module.exports = authMiddleware;