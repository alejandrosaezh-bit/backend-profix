const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

// Generar JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_dev_key', {
        expiresIn: '30d',
    });
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
    body('name').trim().notEmpty().withMessage('El nombre es obligatorio').escape(),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('cedula').trim().notEmpty().withMessage('La cédula es obligatoria').escape(),
    body('phone').optional().trim().escape()
], async (req, res) => {
    console.log("Backend received /register request body:", req.body);
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ Object: 'Validation error', errors: errors.array() });
        }

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
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña es obligatoria')
], async (req, res) => {
    console.log("-> /login request started");
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ Object: 'Validation error', errors: errors.array() });
        }

        const { email, password } = req.body;
        console.log("-> parsed body, email:", email);

        console.time("FindUser");
        const user = await User.findOne({ email }).select('+password');
        console.timeEnd("FindUser");
        console.log("-> user found?", !!user);

        if (user && user.isActive === false) {
            console.log("-> user inactive");
            return res.status(403).json({ message: 'Cuenta desactivada. Contacte al administrador.' });
        }

        console.time("Bcrypt");
        const isMatch = user && (await bcrypt.compare(password, user.password));
        console.timeEnd("Bcrypt");

        if (isMatch) {
            console.log("-> password match, serializing...");
            const userSerialized = serializeUser(user);
            console.log("-> responding 200...");
            res.json({
                ...userSerialized,
                token: generateToken(user._id),
            });
        } else {
            console.log("-> password mismatch, responding 401...");
            res.status(401).json({ message: 'Email o contraseña inválidos' });
        }
    } catch (error) {
        console.error("-> /login error:", error);
        res.status(500).json({ message: error.message });
    }
});

// Helper to safely serialize user data (handling Map types)
const serializeUser = (userDoc) => {
    // toObject with flattenMaps correctly converts Map to Object
    const userObj = userDoc.toObject ? userDoc.toObject({ flattenMaps: true }) : { ...userDoc };

    // Extra safety for profiles if not a Mongoose doc
    if (userObj.profiles && userObj.profiles instanceof Map) {
        userObj.profiles = Object.fromEntries(userObj.profiles);
    }
    delete userObj.password;
    return userObj;
};

// @desc    Obtener perfil del usuario actual
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        // Explicitly fetch the FULL user for the /me route (including heavy profiles)
        // This is fine here as it's only called on sync/refresh, not every request.
        const fullUser = await User.findById(req.user._id).select('-password -documents');
        if (!fullUser) return res.status(404).json({ message: 'User not found' });

        const userSerialized = serializeUser(fullUser);
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

        // Check if we are updating heavy profile data or just simple fields
        const isHeavyUpdate = !!req.body.profiles || !!req.body.avatar || !!req.body.password;

        if (!isHeavyUpdate) {
            // OPTIMIZACIÓN: Actualización directa para campos ligeros (como pushToken, name, phone)
            const updateFields = {};
            if (req.body.name) updateFields.name = req.body.name;
            if (req.body.email) updateFields.email = req.body.email;
            if (req.body.phone) updateFields.phone = req.body.phone;
            if (req.body.cedula) updateFields.cedula = req.body.cedula;
            if (req.body.pushToken) updateFields.pushToken = req.body.pushToken;

            if (Object.keys(updateFields).length > 0) {
                console.log("[PUT /profile] Performing lightweight update:", Object.keys(updateFields));
                const updatedUser = await User.findByIdAndUpdate(
                    req.user._id,
                    { $set: updateFields },
                    { new: true, lean: true }
                );

                if (!updatedUser) return res.status(404).json({ message: 'Usuario no encontrado' });

                return res.json({
                    ...serializeUser(updatedUser),
                    token: generateToken(updatedUser._id),
                });
            }
        }

        // Fallback for heavy updates (avatar, password, or full profiles map)
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.phone) user.phone = req.body.phone;
        if (req.body.avatar) user.avatar = req.body.avatar;
        if (req.body.cedula) user.cedula = req.body.cedula;
        if (req.body.pushToken) user.pushToken = req.body.pushToken;

        if (req.body.profiles) {
            console.log("Updating profiles via user.save() (Map replacement)...");
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

const sendEmail = require('../utils/sendEmail');

// @desc    Solicitar recuperación de contraseña (envía código por email)
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'No existe una cuenta con ese correo electrónico' });
        }

        // Generar un código de 6 dígitos
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Guardar código y expiración (15 minutos)
        user.resetPasswordCode = resetCode;
        user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Enviar email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Solicitud de recuperación de contraseña en ProFix',
                message: `Has solicitado recuperar tu contraseña.\n\nUsa el siguiente código de 6 dígitos para restablecerla:\n\n${resetCode}\n\nEste código expira en 15 minutos.\nSi no solicitaste esto, ignora este correo.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #EA580C; text-align: center;">ProFix App</h2>
                        <p style="font-size: 16px;">Hola <b>${user.name}</b>,</p>
                        <p style="font-size: 16px;">Has solicitado recuperar tu contraseña. Usa el siguiente código para restablecerla:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="font-size: 32px; font-weight: bold; background-color: #F8F9FA; padding: 10px 20px; border-radius: 8px; letter-spacing: 5px;">${resetCode}</span>
                        </div>
                        <p style="font-size: 14px; color: #666;">Este código expira en 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="font-size: 12px; color: #aaa; text-align: center;">El equipo de ProFix</p>
                    </div>
                `
            });

            res.json({ success: true, message: 'Correo enviado. Revisa tu bandeja de entrada.' });
        } catch (emailError) {
            console.error("Error enviando email:", emailError);
            user.resetPasswordCode = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: 'Error al enviar el correo. Inténtalo más tarde.' });
        }
    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// @desc    Restablecer contraseña usando código
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        const user = await User.findOne({ 
            email, 
            resetPasswordCode: code,
            resetPasswordExpire: { $gt: Date.now() } // Verificar que no haya expirado
        });

        if (!user) {
            return res.status(400).json({ message: 'Código inválido o ha expirado. Por favor solicita uno nuevo.' });
        }

        // Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Limpiar campos de reset
        user.resetPasswordCode = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ success: true, message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router;
