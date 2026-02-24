const jwt = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');  // <-- AGGIUNTO RefreshToken
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');  // <-- AGGIUNTO per query

// Generate Access Token (breve durata - 15 minuti)
const generateAccessToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

// Generate Refresh Token (lunga durata - 7 giorni)
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

const saveRefreshToken = async (userId, refreshToken, deviceInfo = null) => {
    // Calcola la data di scadenza (7 giorni da adesso)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Salva nel database
    await RefreshToken.create({
        user_id: userId,
        token: refreshToken,
        expires_at: expiresAt,
        device_info: deviceInfo
    });
};

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({ email, password, name });

        // Generate tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // ✅ NUOVO: Salva il refresh token nel database
        const deviceInfo = req.headers['user-agent'] || null;
        await saveRefreshToken(user.id, refreshToken, deviceInfo);

        res.status(201).json({
            success: true,
            data: {
                user: user.toJSON(),
                token: accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Validate password
        const isMatch = await user.validatePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // ✅ NUOVO: Salva il refresh token nel database
        const deviceInfo = req.headers['user-agent'] || null;
        await saveRefreshToken(user.id, refreshToken, deviceInfo);

        res.json({
            success: true,
            data: {
                user: user.toJSON(),
                token: accessToken,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // 1. Verifica la firma JWT del refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            // Se il token è scaduto o invalido, eliminalo dal DB se presente
            await RefreshToken.destroy({ where: { token: refreshToken } });
            return res.status(401).json({
                success: false,
                message: 'Refresh token expired or invalid. Please login again.'
            });
        }

        // 2. ✅ NUOVO: Verifica che il token esista nel database
        const storedToken = await RefreshToken.findOne({
            where: { token: refreshToken }
        });

        if (!storedToken) {
            // Token non trovato nel DB = è stato revocato o già usato
            // Per sicurezza, invalida TUTTI i token dell'utente (possibile furto)
            await RefreshToken.destroy({ where: { user_id: decoded.id } });
            return res.status(401).json({
                success: false,
                message: 'Refresh token revoked. All sessions invalidated. Please login again.'
            });
        }

        // 3. Verifica che l'utente esista ancora
        const user = await User.findByPk(decoded.id);
        if (!user) {
            await RefreshToken.destroy({ where: { user_id: decoded.id } });
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // 4. ✅ NUOVO: Token Rotation — elimina il vecchio, crea il nuovo
        await storedToken.destroy();  // Elimina il vecchio refresh token

        // Genera nuovi token
        const newAccessToken = generateAccessToken(user.id);
        const newRefreshToken = generateRefreshToken(user.id);

        // Salva il nuovo refresh token nel database
        const deviceInfo = req.headers['user-agent'] || storedToken.device_info;
        await saveRefreshToken(user.id, newRefreshToken, deviceInfo);

        res.json({
            success: true,
            data: {
                token: newAccessToken,
                refreshToken: newRefreshToken
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during token refresh'
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Elimina il singolo refresh token dal database
            await RefreshToken.destroy({ where: { token: refreshToken } });
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};

exports.logoutAll = async (req, res) => {
    try {
        // Elimina TUTTI i refresh token dell'utente
        const deletedCount = await RefreshToken.destroy({ where: { user_id: req.user.id }
        });

        res.json({
            success: true,
            message: `Logged out from all devices. ${deletedCount} sessions invalidated.`
        });
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};

exports.getSessions = async (req, res) => {
    try {
        const sessions = await RefreshToken.findAll({
            where: {
                user_id: req.user.id,
                expires_at: { [Op.gt]: new Date() }  // Solo token non scaduti
            },
            attributes: ['id', 'device_info', 'expires_at', 'created_at'],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                activeSessions: sessions.length,
                sessions
            }
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
    // GET ME
    exports.getMe = async (req, res) => {
        try {
            res.json({
                success: true,
                data: req.user.toJSON()
            });
        } catch (error) {
            console.error('GetMe error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    };

// UPDATE PROFILE
    exports.updateProfile = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { name, email } = req.body;
            const user = req.user;

            if (email && email !== user.email) {
                const existingUser = await User.findOne({ where: { email } });
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email already in use'
                    });
                }
                user.email = email;
            }

            if (name) {
                user.name = name;
            }

            await user.save();

            res.json({
                success: true,
                data: user.toJSON()
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during profile update'
            });
        }
    };

// UPDATE PASSWORD
    exports.updatePassword = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }

            const { currentPassword, newPassword } = req.body;
            const user = req.user;

            const isMatch = await user.validatePassword(currentPassword);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect'
                });
            }

            user.password = newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            console.error('Update password error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during password update'
            });
        }
    };

// DELETE ACCOUNT
    exports.deleteAccount = async (req, res) => {
        try {
            const userId = req.user.id;
            const { Transaction, Tag, RefreshToken } = require('../models');

            await RefreshToken.destroy({ where: { user_id: userId } });
            await Transaction.destroy({ where: { user_id: userId } });
            await Tag.destroy({ where: { user_id: userId } });
            await User.destroy({ where: { id: userId } });

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error during account deletion'
            });
        }
    };
    };