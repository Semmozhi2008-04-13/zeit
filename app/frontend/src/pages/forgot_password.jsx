import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api.js";
import "./forgot_password.css"; // <--- ADD THIS LINE

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // STEP 1: Send OTP to registered email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: cleanEmail }),
      });

      if (!data.success) {
        throw new Error(data.message || "Could not send OTP.");
      }

      setSuccess(data.message || "OTP sent to your email.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Enter OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setStep(3);
  };

  // STEP 3: Verify OTP and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
          password: newPassword,
        }),
      });

      if (!data.success) {
        throw new Error(data.message || "Password reset failed.");
      }

      setSuccess(data.message || "Password reset successfully.");
      setStep(4);
    } catch (err) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="forgot-password-container">
        <h1>Zeit</h1>
        <h2>Forgot Password</h2>

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <p>Enter your registered email address.</p>

            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send Email OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p>
              Enter the 6-digit OTP sent to <strong>{email}</strong>.
            </p>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              maxLength={6}
              onChange={(e) => {
                setOtp(
                  e.target.value.replace(/\D/g, "").slice(0, 6)
                );
                setError("");
              }}
              required
            />

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <button type="submit">
              Continue
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <p>Create your new password.</p>

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        {step === 4 && (
          <div>
            <h3>Password reset successful!</h3>
            <p>You can now log in using your new password.</p>
            <Link to="/login">Back to Login</Link>
          </div>
        )}

        {error && step === 1 && <p className="error">{error}</p>}
        {success && step === 4 && (
          <p className="success">{success}</p>
        )}

        {step !== 4 && (
          <p style={{ marginTop: "20px", textAlign: "center" }}>
            <Link to="/login">Back to Login</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;