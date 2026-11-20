
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const sendOTPEmail = require("../utils/sendEmail");
const generateOTP = require("../utils/generateOTP");

// Generate JWT token
const makeToken = (user) => {
  return jwt.sign(
    { userId: user.user_id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// User data returned to frontend
const publicUser = (user) => ({
  user_id: user.user_id,
  name: user.name,
  phone: user.phone,
  email: user.email
});

// Normalize email
const normalizeEmail = (email) => {
  return email.trim().toLowerCase();
};


// ==========================================
// 1. REQUEST REGISTRATION OTP
// ==========================================

const requestRegistrationOTP = async (req, res) => {
  try {
    const { name, phone, email, password, address } = req.body;

    if (!name || !phone || !email || !password || !address) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields"
      });
    }

    const cleanEmail = normalizeEmail(email);
    const cleanPhone = phone.trim();

    if (!/^\d{10}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit phone number"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }

    // Check existing account
    const [existingUsers] = await pool.query(
      "SELECT user_id FROM user WHERE email = ? OR phone = ?",
      [cleanEmail, cleanPhone]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email or phone number is already registered"
      });
    }

    // Check resend cooldown
    const [pending] = await pool.query(
      `SELECT created_at
       FROM pending_registrations
       WHERE email = ?`,
      [cleanEmail]
    );

    if (pending.length > 0) {
      const createdAt = new Date(pending[0].created_at);
      const elapsed = Date.now() - createdAt.getTime();

      if (elapsed < 60000) {
        return res.status(429).json({
          success: false,
          message: "Please wait 60 seconds before requesting another OTP"
        });
      }
    }

    // Generate OTP and hashes
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const passwordHash = await bcrypt.hash(password, 10);

    // Remove previous pending registration
    await pool.query(
      "DELETE FROM pending_registrations WHERE email = ?",
      [cleanEmail]
    );

    // Save pending registration
    await pool.query(
      `INSERT INTO pending_registrations
       (name, phone, email, password_hash, address_line,
        otp_hash, expires_at, attempts)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)`,
      [
        name.trim(),
        cleanPhone,
        cleanEmail,
        passwordHash,
        address.trim(),
        otpHash
      ]
    );

    // Send OTP email
    try {
      await sendOTPEmail(cleanEmail, otp);
    } catch (mailError) {
      console.error("Registration email error:", mailError);

      await pool.query(
        "DELETE FROM pending_registrations WHERE email = ?",
        [cleanEmail]
      );

      return res.status(500).json({
        success: false,
        message: "Unable to send OTP email. Please try again."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Registration OTP sent to your email"
    });

  } catch (error) {
    console.error("Registration OTP error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while requesting registration OTP"
    });
  }
};


// ==========================================
// 2. VERIFY REGISTRATION OTP
// ==========================================

const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    const cleanEmail = normalizeEmail(email);

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP"
      });
    }

    const [pendingRows] = await pool.query(
      `SELECT *
       FROM pending_registrations
       WHERE email = ?
       AND expires_at > NOW()
       AND attempts < 5`,
      [cleanEmail]
    );

    if (pendingRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or invalid. Please request a new OTP."
      });
    }

    const pending = pendingRows[0];

    const isMatch = await bcrypt.compare(
      otp,
      pending.otp_hash
    );

    if (!isMatch) {
      await pool.query(
        `UPDATE pending_registrations
         SET attempts = attempts + 1
         WHERE id = ?`,
        [pending.id]
      );

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP"
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check duplicates again
      const [existingUsers] = await connection.query(
        "SELECT user_id FROM user WHERE email = ? OR phone = ?",
        [pending.email, pending.phone]
      );

      if (existingUsers.length > 0) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message: "Email or phone number is already registered"
        });
      }

      // Create user
      const [userResult] = await connection.query(
        `INSERT INTO user
         (name, phone, email, password_hash)
         VALUES (?, ?, ?, ?)`,
        [
          pending.name,
          pending.phone,
          pending.email,
          pending.password_hash
        ]
      );

      // Create address
      await connection.query(
        `INSERT INTO address
         (user_id, address_line, city, state, pincode)
         VALUES (?, ?, NULL, NULL, NULL)`,
        [
          userResult.insertId,
          pending.address_line
        ]
      );

      // Delete pending registration
      await connection.query(
        "DELETE FROM pending_registrations WHERE id = ?",
        [pending.id]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: "Email verified and registration successful"
      });

    } catch (error) {
      await connection.rollback();
      throw error;

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during OTP verification"
    });
  }
};


// ==========================================
// 3. LOGIN USING EMAIL AND PASSWORD
// ==========================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const [users] = await pool.query(
      "SELECT * FROM user WHERE email = ?",
      [normalizeEmail(email)]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = makeToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
};


// ==========================================
// 4. GET USER PROFILE
// ==========================================

const profile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.query(
      `SELECT
         u.user_id,
         u.name,
         u.phone,
         u.email,
         a.address_id,
         a.address_line,
         a.city,
         a.state,
         a.pincode
       FROM user u
       LEFT JOIN address a ON u.user_id = a.user_id
       WHERE u.user_id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile"
    });
  }
};


// ==========================================
// 5. REQUEST PASSWORD RESET OTP
// ==========================================

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const cleanEmail = normalizeEmail(email);

    const [users] = await pool.query(
      "SELECT * FROM user WHERE email = ?",
      [cleanEmail]
    );

    // Generic response to avoid revealing registered emails
    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: "If this email is registered, an OTP will be sent."
      });
    }

    const user = users[0];

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    await pool.query(
      `INSERT INTO password_reset
       (user_id, otp_hash, expire_at, otp_used)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)`,
      [user.user_id, otpHash]
    );

    try {
      await sendOTPEmail(cleanEmail, otp);
    } catch (mailError) {
      console.error("Password reset email error:", mailError);

      await pool.query(
        `UPDATE password_reset
         SET otp_used = 1
         WHERE user_id = ?
         AND otp_hash = ?`,
        [user.user_id, otpHash]
      );

      return res.status(500).json({
        success: false,
        message: "Unable to send OTP email. Please try again."
      });
    }

    return res.status(200).json({
      success: true,
      message: "If this email is registered, an OTP will be sent."
    });

  } catch (error) {
    console.error("Password reset request error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while requesting password reset"
    });
  }
};


// ==========================================
// 6. RESET PASSWORD USING EMAIL OTP
// ==========================================

const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password are required"
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }

    const cleanEmail = normalizeEmail(email);

    const [users] = await pool.query(
      "SELECT user_id FROM user WHERE email = ?",
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    const userId = users[0].user_id;

    const [resetRows] = await pool.query(
      `SELECT *
       FROM password_reset
       WHERE user_id = ?
       AND otp_used = 0
       AND expire_at > NOW()
       ORDER BY reset_id DESC
       LIMIT 5`,
      [userId]
    );

    let validOTP = null;

    for (const row of resetRows) {
      const isMatch = await bcrypt.compare(
        otp,
        row.otp_hash
      );

      if (isMatch) {
        validOTP = row;
        break;
      }
    }

    if (!validOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      await connection.query(
        "UPDATE user SET password_hash = ? WHERE user_id = ?",
        [passwordHash, userId]
      );

      await connection.query(
        "UPDATE password_reset SET otp_used = 1 WHERE user_id = ?",
        [userId]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: "Password reset successful. Please login."
      });

    } catch (error) {
      await connection.rollback();
      throw error;

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Password reset error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while resetting password"
    });
  }
};


// ==========================================
// EXPORT ALL CONTROLLER FUNCTIONS
// ==========================================

module.exports = {
  requestRegistrationOTP,
  verifyRegistrationOTP,
  login,
  profile,
  requestPasswordReset,
  resetPassword
};
