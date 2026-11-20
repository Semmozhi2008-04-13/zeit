
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";

function Register() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    addressType: "Home",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "phone"
          ? value.replace(/\D/g, "").slice(0, 10)
          : value,
    }));
  };

  // STEP 1: Request registration OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { name, phone, email, password, address } = formData;

    if (!name.trim() || !address.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/register/request-otp", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          address: address.trim(),
        }),
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

  // STEP 2: Verify OTP and create account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/register/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp,
        }),
      });

      if (!data.success) {
        throw new Error(data.message || "OTP verification failed.");
      }

      localStorage.removeItem("zeit-token");
      localStorage.removeItem("zeit-user");

      navigate("/login", {
        replace: true,
        state: {
          registered: true,
          registeredPhone: formData.phone,
        },
      });
    } catch (err) {
      setError(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-account-page">
      <div className="create-account-card">
        <h1 className="zeit-title">Zeit</h1>
        <h2>Create Account</h2>

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="create-form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="create-form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter your 10-digit phone number"
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
                required
              />
            </div>

            <div className="create-form-group">
              <label>Email ID</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="create-form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
              />
            </div>

            <div className="create-form-group">
              <label>Address</label>
              <textarea
                name="address"
                placeholder="Enter your address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="address-type-group">
              <label>Address Type</label>
              <div className="address-type-options">
                {["Home", "Office", "Other"].map((type) => (
                  <label
                    key={type}
                    className={`address-option ${
                      formData.addressType === type ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="addressType"
                      value={type}
                      checked={formData.addressType === type}
                      onChange={handleChange}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="error">{error}</p>}

            <button
              type="submit"
              className="confirm-btn"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send Email OTP"}
            </button>

            <p>
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                style={{ cursor: "pointer" }}
              >
                Login
              </span>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <p>
              We sent a 6-digit verification code to:
            </p>

            <strong>{formData.email}</strong>

            <div className="create-form-group">
              <label>Email OTP</label>
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
            </div>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

            <button
              type="submit"
              className="confirm-btn"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP & Create Account"}
            </button>

            <p>
              <span
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setError("");
                  setSuccess("");
                }}
                style={{ cursor: "pointer" }}
              >
                Back to registration
              </span>
            </p>
          </form>
        )}

        {step === 1 && success && (
          <p className="success">{success}</p>
        )}
      </div>
    </div>
  );
}

export default Register;
