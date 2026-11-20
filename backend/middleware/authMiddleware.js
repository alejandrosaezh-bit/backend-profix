const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev_key');

            req.user = await User.findById(decoded.id).select('-password -profiles');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    const email = req.user?.email?.trim().toLowerCase();
    const name = req.user?.name?.trim().toLowerCase();

    if (
        req.user &&
        (req.user.role === 'admin' ||
            email === 'admin@profix.com' ||
            email === 'admin@profesionalcercano.com' ||
            email === 'admin@admin.com' ||
            email === 'alejandrosaezh@gmail.com' ||
            name === 'admin')
    ) {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
