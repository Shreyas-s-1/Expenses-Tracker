const UserDB = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');

async function register(req, res) {
    const { name, email: submittedEmail, password } = req.body;
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    const email = typeof submittedEmail === 'string' ? submittedEmail.trim().toLowerCase() : '';
    if (!normalizedName || !email || !password) {
        return res.status(400).json({ success: false, error: "All fields are required" });
    }

    if (normalizedName.length > 80) {
        return res.status(400).json({ success: false, error: "Name must be 80 characters or fewer" });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, error: "Password must be at least 6 characters long" });
    }
    try {
        if (await UserDB.findOne({ email: email })) {    
            return res.status(400).json({ success: false, error: "User with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await UserDB.create({
            name: normalizedName,
            email: email,
            password: hashedPassword
        });

        const token = jwt.sign({ id: user._id }, process.env.SEC_KEY || process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });

    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while checking user existence" });
    }
}

async function login(req, res) {
    const { email: submittedEmail, password } = req.body;
    const email = typeof submittedEmail === 'string' ? submittedEmail.trim().toLowerCase() : '';

    if (!email || !password) {
        return res.status(400).json({ success: false, error: "All fields are required" });
    }
    
    try {
        const user = await UserDB.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ success: false, error: "Invalid email or password" });
        } 
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, error: "Invalid email or password" });
        }
        const token = jwt.sign({ id: user._id }, process.env.SEC_KEY || process.env.JWT_SECRET, { expiresIn: '1h' });
        return res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while logging in" });
    }
}

async function getUser(req, res) {
    try {
        const user = await UserDB.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        return res.json({ success: true, user });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while fetching user details" });
    }
}

async function updateProfile(req, res) {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ success: false, error: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    try {
        const exists = await UserDB.findOne({ email, _id: { $ne: req.user._id } });
        if (exists) {
            return res.status(400).json({ success: false, error: "Email is already in use by another user" });
        }
        const user = await UserDB.findByIdAndUpdate(
            req.user._id,
            { name, email },
            { new: true, runValidators: true, select: "name email" }
        );
        res.json({
            success: true,
            user
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while updating user profile" });
    }
} 

async function updatePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: "All fields are required and new password must be at least 6 characters long" });
    }

    try {
        const user = await UserDB.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ success: false, error: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while updating password" });
    }
}

module.exports = { register, login, getUser, updateProfile, updatePassword };