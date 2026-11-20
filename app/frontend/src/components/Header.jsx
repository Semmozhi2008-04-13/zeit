import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

export default function Header({ cartCount }) {
    return (
        <header className="header">
            <Link to="/home" className="logo">
                <h2>ZEIT</h2>
            </Link>
            <nav className="nav">
                <Link to="/home">Home</Link>
                <Link to="/cart">Cart ({cartCount || 0})</Link>
                <Link to="/profile">Profile</Link>
            
            </nav>
        </header>
    );
}