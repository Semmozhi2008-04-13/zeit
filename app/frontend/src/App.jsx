import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/login.jsx";
import Profile from "./pages/profile";
import Register from "./pages/register";
import ForgotPassword from "./pages/forgot_password.jsx";
import Home from "./pages/home.jsx";
import Cart from "./pages/cart.jsx";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* CHANGED THIS LINE: from /forgot_password to /forgot-password */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        <Route path="/home" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;