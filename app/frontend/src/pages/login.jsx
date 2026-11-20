import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { apiRequest } from "../api.js";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.registeredEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registered = location.state?.registered === true;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        })
      });

      if (data.success) {
        localStorage.setItem("zeit-token", data.token);
        localStorage.setItem("zeit-user", JSON.stringify(data.user));
        navigate("/home");
      } else {
        setError(data.message || "Login failed.");
      }
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="zeit-login-page">
      <section className="zeit-login-card">
        
        {/* Brand Logo */}
        <div className="login-brand">
          <div className="login-logo">Z</div>
          <span>ZEIT</span>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <span className="login-eyebrow">WELCOME BACK</span>
          <h1>Good to see you <span>again.</span></h1>
          <p>Login to continue your fresh shopping experience.</p>
        </div>

        {registered && (
          <div className="login-success" role="status">
            <span>✓</span> Your account has been created successfully. Please login.
          </div>
        )}

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="zeit-login-form">
          <div className="login-field">
            <label htmlFor="login-email">Email address</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">✉</span>
              <input
                id="login-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <div className="login-label-row">
              <label htmlFor="login-password">Password</label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
            <div className="login-input-wrapper">
              <span className="login-input-icon">⌑</span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button type="submit" className="zeit-login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login to ZEIT"}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="login-divider">
          <span>NEW TO ZEIT?</span>
        </div>

        <p className="login-register-text">
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>

        <div className="login-footer">
          Fresh choices. Better living. Every day.
        </div>
      </section>

      {/* Right Side Visual (The dark green block) */}
      <aside className="zeit-login-visual">
        <div className="login-visual-content">
          <span className="visual-tag">FRESHNESS, DELIVERED</span>
          <h2>
            A little freshness
            <br />
            goes a <span>long way.</span>
          </h2>
          <p>
            Discover fresh fruits, vegetables and everyday essentials
            at ZEIT. Your fresh shopping journey starts here.
          </p>
          <div className="visual-bottom">
            <span>01</span>
            <div></div>
            <span>FRESH EVERY DAY</span>
          </div>
        </div>
      </aside>
    </main>
  );
}

export default Login;