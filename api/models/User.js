const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @fileoverview User schema for the ToDo Center system.
 * Implements validations and requirements specified in US-1 (Basic registration).
 * 
 * @module models/User
 * @requires mongoose
 * @requires bcryptjs
 * @since 1.0.0
 */

/**
 * @typedef {Object} UserDocument
 * @property {string} nombres - User's first names (2-50 characters)
 * @property {string} apellidos - User's last names (2-50 characters)
 * @property {number} edad - User's age (≥13 years, integer)
 * @property {string} correo - Unique email address (RFC 5322 format)
 * @property {string} contrasena - Hashed password (≥8 chars, complex validation)
 * @property {Date} lastLogin - Last successful login date
 * @property {number} loginAttempts - Failed login attempts counter
 * @property {Date} lockUntil - Date until when account is locked
 * @property {boolean} isLocked - Indicates if account is locked
 * @property {boolean} isActive - Indicates if account is active
 * @property {Date} createdAt - Creation date (automatic)
 * @property {Date} updatedAt - Last update date (automatic)
 */

/**
 * User schema that meets US-1 criteria (Basic registration).
 * Includes security validations, login attempt control and secure persistence.
 * 
 * @type {mongoose.Schema<UserDocument>}
 */
const UserSchema = new mongoose.Schema({
  // Fields required by US-1
  nombres: {
    type: String,
    required: [true, 'First names are required'],
    trim: true,
    minlength: [2, 'First names must have at least 2 characters'],
    maxlength: [50, 'First names cannot exceed 50 characters']
  },
  
  apellidos: {
    type: String,
    required: [true, 'Last names are required'],
    trim: true,
    minlength: [2, 'Last names must have at least 2 characters'],
    maxlength: [50, 'Last names cannot exceed 50 characters']
  },
  
  edad: {
    type: Number,
    required: [true, 'Age is required'],
    min: [13, 'Age must be greater than or equal to 13 years'],
    max: [120, 'Age cannot exceed 120 years'],
    validate: {
      validator: Number.isInteger,
      message: 'Age must be an integer'
    }
  },
  
  correo: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        // Simplified but robust RFC 5322 regex
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  
  contrasena: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must have at least 8 characters'],
    validate: {
      validator: function(password) {
        
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(password);
      },
      message: 'Password must contain at least: 1 uppercase, 1 lowercase, 1 number and 1 special character'
    }
  },
  //Fields for US-2
  lastLogin: {
    type: Date,
    default: Date.now
  },

  loginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: {
    type: Date
  },

  isLocked: {
    type: Boolean,
    default: false
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true, // Automatically creates createdAt and updatedAt in ISO-8601
  toJSON: {
    transform: function(doc, ret) {
      // Do not include password in JSON responses
      delete ret.contrasena;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Middleware to hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('contrasena')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.contrasena = await bcrypt.hash(this.contrasena, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compares a plain text password with the user's hashed password.
 * 
 * @method comparePassword
 * @memberof UserSchema
 * @param {string} candidatePassword - Plain text password to verify
 * @returns {Promise<boolean>} true if passwords match, false otherwise
 * @example
 * const user = await User.findById(userId);
 * const isValid = await user.comparePassword('password123');
 * if (isValid) {
 *   console.log('Correct password');
 * }
 */
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.contrasena);
};

/**
 * Verifies if the user account is currently locked.
 * An account is considered locked if it has a valid future lockUntil timestamp.
 * 
 * @method isAccountLocked
 * @memberof UserSchema
 * @returns {boolean} true if account is locked, false otherwise
 * @example
 * const user = await User.findById(userId);
 * if (user.isAccountLocked()) {
 *   console.log('Account locked until:', user.lockUntil);
 * }
 */
UserSchema.methods.isAccountLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Resets failed login attempts after a successful login.
 * Removes lock fields and updates last access date.
 * 
 * @method resetLoginAttempts
 * @memberof UserSchema
 * @returns {Promise<UpdateResult>} Update operation result
 * @example
 * const user = await User.findById(userId);
 * await user.resetLoginAttempts();
 * console.log('Login attempts reset');
 */
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { lockUntil: 1, loginAttempts: 1 }, // Remove lock fields
    $set: { 
      lastLogin: new Date(),  // Update last access
      isLocked: false       // Mark as not locked
    }
  });
};

/**
 * Increments the failed login attempts counter.
 * If maximum attempts (5) are reached, locks the account for 10 minutes.
 * 
 * @method incrementLoginAttempts
 * @memberof UserSchema
 * @returns {Promise<UpdateResult>} Update operation result
 * @example
 * const user = await User.findById(userId);
 * await user.incrementLoginAttempts();
 * if (user.isAccountLocked()) {
 *   console.log('Account locked due to excessive attempts');
 * }
 */
UserSchema.methods.incrementLoginAttempts = function() {
  const maxAttempts = 5;
  const lockTime = 10 * 60 * 1000; // 10 minutes
  
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        loginAttempts: 1,
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = {
      lockUntil: Date.now() + lockTime
    };
  }
  
  return this.updateOne(updates);
};

/**
 * Resets the user's password and clears security counters.
 * Used in password recovery processes.
 * 
 * @method resetPassword
 * @memberof UserSchema
 * @param {string} newPassword - New password in plain text (will be hashed automatically)
 * @returns {Promise<UserDocument>} Updated user
 * @example
 * const user = await User.findById(userId);
 * await user.resetPassword('newPassword123!');
 * console.log('Password updated successfully');
 */
UserSchema.methods.resetPassword = async function(newPassword) {
  this.contrasena = newPassword;
  // Reset login attempts when changing password
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.isLocked = false;
  return await this.save();
};

module.exports = mongoose.model('User', UserSchema);