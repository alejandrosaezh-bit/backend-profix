const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Generar JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_dev_key', {
        expiresIn: '30d',
    });
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    console.log("Backend received /register request body:", req.body);
    try {
        const { name, email, password, role, phone, cedula } = req.body;

        if (!cedula) {
            console.log("Register error: Missing cedula");
            return res.status(400).json({ message: 'La cédula es obligatoria' });
        }

        console.log("Checking if user exists...");
        const userExists = await User.findOne({ $or: [{ email }, { cedula }] });

        if (userExists) {
            console.log("User already exists:", userExists.email);
            return res.status(400).json({ message: 'El usuario (email o cédula) ya existe' });
        }

        console.log("Hashing password...");
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        console.log("Creating user in DB...");
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            cedula,
            role: role || 'client',
            phone
        });
        console.log("User created successfully:", user._id);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                cedula: user.cedula,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Datos de usuario inválidos' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Autenticar usuario y obtener token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && user.isActive === false) {
            return res.status(403).json({ message: 'Cuenta desactivada. Contacte al administrador.' });
        }

        if (user && (await bcrypt.compare(password, user.password))) {
            const userSerialized = serializeUser(user);
            res.json({
                ...userSerialized,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Email o contraseña inválidos' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Helper to safely serialize user data (handling Map types)
const serializeUser = (userDoc) => {
    const userObj = userDoc.toObject ? userDoc.toObject() : userDoc;
    if (userObj.profiles && userObj.profiles instanceof Map) {
        userObj.profiles = Object.fromEntries(userObj.profiles);
    } else if (userObj.profiles && typeof userObj.profiles === 'object' && !Array.isArray(userObj.profiles)) {
        // Already an object, but ensure it's not a weird Mongoose internal
    }
    return userObj;
};

// @desc    Obtener perfil del usuario actual
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // req.user is a Mongoose document from protect middleware
        const userSerialized = serializeUser(req.user);
        res.json(userSerialized);
    } catch (error) {
        console.error("Error in GET /me:", error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Actualizar perfil del usuario
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        console.log("PUT /profile request received. Body keys:", Object.keys(req.body));
        if (req.body.avatar) console.log("Avatar length:", req.body.avatar.length);

        console.log("Finding user by ID:", req.user._id);

        const user = req.user;

        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.phone) user.phone = req.body.phone;
        if (req.body.avatar) user.avatar = req.body.avatar;
        if (req.body.cedula) user.cedula = req.body.cedula;

        if (req.body.profiles) {
            console.log("Updating profiles via user.save() (Map replacement)...");
            // Replace the entire Map with new entries
            // This ensures deleted keys are actually removed
            user.profiles = new Map(Object.entries(req.body.profiles));
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        console.log("DB Update Result:", updatedUser ? "Success" : "Null");
        if (updatedUser) {
            console.log("Updated Cedula:", updatedUser.cedula);
            console.log("Updated Avatar Length:", updatedUser.avatar ? updatedUser.avatar.length : 0);
            console.log("Updated Profiles (Map) Size:", updatedUser.profiles ? updatedUser.profiles.size : 0);
            if (updatedUser.profiles && updatedUser.profiles.size > 0) {
                console.log("Updated Profiles Keys:", Array.from(updatedUser.profiles.keys()));
            }
            const userSerialized = serializeUser(updatedUser);

            res.json({
                ...userSerialized,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error("Error in PUT /profile:", error);
        if (error.name === 'ValidationError') {
            Object.keys(error.errors).forEach(key => {
                console.error(`Validation Error [${key}]:`, error.errors[key].message);
            });
        }
        res.status(500).json({
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// @desc    Toggle item in professional portfolio
// @route   PUT /api/auth/portfolio
router.put('/portfolio', protect, async (req, res) => {
    try {
        const { mediaUrl, category } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        if (!category) return res.status(400).json({ message: 'Se requiere una categoría' });

        // Ensure profiles map exists
        if (!user.profiles) user.profiles = new Map();

        // Get the profile for the category
        let profile = user.profiles.get(category);
        if (!profile) {
            profile = {
                bio: '',
                subcategories: [],
                gallery: [],
                isActive: true
            };
        }

        // Ensure gallery array exists
        // Since it's a Map of sub-schemas, we might need to handle it carefully
        let gallery = profile.gallery || [];

        // Toggle logic
        const index = gallery.indexOf(mediaUrl);
        if (index > -1) {
            gallery.splice(index, 1);
        } else {
            gallery.push(mediaUrl);
        }

        // Update the profile object
        profile.gallery = gallery;

        // Update the map
        user.profiles.set(category, profile);
        
        // Mark as modified if using Map
        user.markModified('profiles');
        
        await user.save();
        res.json(serializeUser(user));
    } catch (error) {
        console.error("Error toggle portfolio:", error);
        res.status(500).json({ message: error.message });
    }
});

// Google Sign-In
router.post('/google', async (req, res) => {
    try {
        const { email, name, googleId, avatar } = req.body;

        if (!email || !googleId) {
            return res.status(400).json({ message: 'Faltan datos de Google' });
        }

        // Buscar usuario por email
        let user = await User.findOne({ email });

        if (user) {
            // Usuario existe: Actualizar googleId si no lo tiene
            if (!user.googleId) {
                user.googleId = googleId;
                if (avatar && !user.avatar) user.avatar = avatar; // Actualizar foto si no tiene
                await user.save();
            }
        } else {
            // Usuario no existe: Crear nuevo
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = new User({
                name: name || 'Usuario Google',
                email,
                avatar,
                password: hashedPassword,
                googleId,
                role: 'client', // Por defecto cliente
                // Cedula se pedirá después o se deja vacía (schema sparse)
            });
            await user.save();
        }

        // Generar JWT
        res.json({
            ...serializeUser(user),
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error("Google Login Error:", error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
