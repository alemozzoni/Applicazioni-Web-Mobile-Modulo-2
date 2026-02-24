const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RefreshToken = sequelize.define('RefreshToken', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        token: {
            type: DataTypes.TEXT,
            allowNull: false,
            unique: true
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        device_info: {
            type: DataTypes.STRING,
            allowNull: true  // Opzionale: salva info sul dispositivo (es. "Chrome su Windows")
        }
    }, {
        tableName: 'refresh_tokens',
        indexes: [
            { fields: ['user_id'] },
            { fields: ['token'], unique: true },
            { fields: ['expires_at'] }  // Per la pulizia periodica
        ]
    });

    // Associazioni
    RefreshToken.associate = (models) => {
        RefreshToken.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return RefreshToken;
};

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

exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { Transaction, Tag } = require('../models');

        // Elimina tutti i refresh token dell'utente
        await RefreshToken.destroy({ where: { user_id: userId } });  // <-- NUOVO

        // Delete all user's transactions
        await Transaction.destroy({ where: { user_id: userId } });

        // Delete all user's tags
        await Tag.destroy({ where: { user_id: userId } });

        // Delete user
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