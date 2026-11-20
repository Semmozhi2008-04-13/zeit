
import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/footer.jsx";

import "./home.css";

// Product images
import apple from "../assets/apple.jpg";
import banana from "../assets/banana.jpg";
import beetroot from "../assets/beetroot.jpg";
import cabbage from "../assets/Cabbage.jpg";
import carrot from "../assets/carrot.jpg";
import cauliflower from "../assets/cauliflower.jpg";
import corn from "../assets/corn.jpg";
import guava from "../assets/guava.jpg";
import kiwi from "../assets/kiwi.jpg";
import onion from "../assets/onion.jpg";
import pineapple from "../assets/Pineapple.jpg";
import potato from "../assets/potato.jpg";
import strawberry from "../assets/strawberry.jpg";
import tomato from "../assets/tomato.jpg";
import watermelon from "../assets/watermelon.jpg";

function Home() {
    const [category, setCategory] = useState("All");

    // Load saved cart items
    const [cartItems, setCartItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("zeit-cart") || "[]");
        } catch {
            return [];
        }
    });

    // Product list
    const products = [
        { id: 1, name: "Fresh Apples", price: 120, unit: "kg", image: apple, category: "Fruits" },
        { id: 2, name: "Banana", price: 50, unit: "dozen", image: banana, category: "Fruits" },
        { id: 3, name: "Guava", price: 60, unit: "kg", image: guava, category: "Fruits" },
        { id: 4, name: "Kiwi", price: 180, unit: "kg", image: kiwi, category: "Fruits" },
        { id: 5, name: "Strawberry", price: 150, unit: "box", image: strawberry, category: "Fruits" },
        { id: 6, name: "Pineapple", price: 80, unit: "piece", image: pineapple, category: "Fruits" },
        { id: 7, name: "Watermelon", price: 40, unit: "kg", image: watermelon, category: "Fruits" },
        { id: 8, name: "Carrot", price: 60, unit: "kg", image: carrot, category: "Vegetables" },
        { id: 9, name: "Tomato", price: 40, unit: "kg", image: tomato, category: "Vegetables" },
        { id: 10, name: "Beetroot", price: 50, unit: "kg", image: beetroot, category: "Vegetables" },
        { id: 11, name: "Potato", price: 35, unit: "kg", image: potato, category: "Vegetables" },
        { id: 12, name: "Cabbage", price: 45, unit: "piece", image: cabbage, category: "Vegetables" },
        { id: 13, name: "Cauliflower", price: 55, unit: "piece", image: cauliflower, category: "Vegetables" },
        { id: 14, name: "Sweet Corn", price: 30, unit: "piece", image: corn, category: "Vegetables" },
        { id: 15, name: "Onion", price: 45, unit: "kg", image: onion, category: "Vegetables" }
    ];

    // Save updated cart
    const updateCart = (updatedCart) => {
        setCartItems(updatedCart);
        localStorage.setItem("zeit-cart", JSON.stringify(updatedCart));
    };

    // Add product to cart
    const addToCart = (product) => {
        const existingProduct = cartItems.find(
            (item) => item.id === product.id
        );

        let updatedCart;

        if (existingProduct) {
            updatedCart = cartItems.map((item) =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        } else {
            updatedCart = [
                ...cartItems,
                { ...product, quantity: 1 }
            ];
        }

        updateCart(updatedCart);
    };

    // Calculate total number of items
    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    // Filter products
    const filteredProducts =
        category === "All"
            ? products
            : products.filter(
                (product) => product.category === category
            );

    // Scroll to products
    const scrollToProducts = () => {
        document.getElementById("products")?.scrollIntoView({
            behavior: "smooth"
        });
    };

    return (
        <div className="zeit-home">

            <Header cartCount={cartCount} />

            {/* Hero Banner */}
            <section className="zeit-hero">
                <div className="hero-content">
                    <span className="hero-tag">
                        FRESHNESS YOU CAN TRUST
                    </span>

                    <h1>
                        Fresh Food.<br />
                        Healthy Living.
                    </h1>

                    <p>
                        Discover farm-fresh fruits and vegetables,
                        carefully selected for your everyday needs.
                    </p>

                    <button onClick={scrollToProducts}>
                        Shop Now <span>→</span>
                    </button>
                </div>

                <div className="hero-decoration">
                    <img src={apple} alt="Fresh apple" />
                    <img src={carrot} alt="Fresh carrot" />
                    <img src={banana} alt="Fresh banana" />
                </div>
            </section>

            {/* Benefits */}
            <section className="zeit-benefits">
                <div>🌱 <span>Fresh Products</span></div>
                <div>🚚 <span>Convenient Shopping</span></div>
                <div>🥬 <span>Everyday Essentials</span></div>
            </section>

            {/* Categories */}
            <section className="zeit-categories">
                <div className="section-heading">
                    <span>EXPLORE OUR COLLECTION</span>
                    <h2>Shop by Category</h2>
                    <p>Everything fresh, all in one place.</p>
                </div>

                <div className="category-cards">

                    <button
                        className="category-card fruit-category"
                        onClick={() => {
                            setCategory("Fruits");
                            scrollToProducts();
                        }}
                    >
                        <img src={strawberry} alt="Fresh fruits" />

                        <div>
                            <h3>Fresh Fruits</h3>
                            <p>Nature's sweetest picks</p>
                            <span>Explore Fruits →</span>
                        </div>
                    </button>

                    <button
                        className="category-card vegetable-category"
                        onClick={() => {
                            setCategory("Vegetables");
                            scrollToProducts();
                        }}
                    >
                        <img src={carrot} alt="Fresh vegetables" />

                        <div>
                            <h3>Fresh Vegetables</h3>
                            <p>Goodness in every bite</p>
                            <span>Explore Vegetables →</span>
                        </div>
                    </button>

                </div>
            </section>

            {/* Products */}
            <section className="zeit-products" id="products">

                <div className="section-heading">
                    <span>HANDPICKED FOR YOU</span>
                    <h2>Our Fresh Products</h2>
                    <p>
                        Choose your favourites and add them to your cart.
                    </p>
                </div>

                {/* Category Filters */}
                <div className="product-filters">
                    {["All", "Fruits", "Vegetables"].map((item) => (
                        <button
                            key={item}
                            className={category === item ? "active" : ""}
                            onClick={() => setCategory(item)}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                {/* Cart Count */}
                <p className="cart-message">
                    Items added to cart: <strong>{cartCount}</strong>
                </p>

                {/* Product Cards */}
                <div className="zeit-product-grid">

                    {filteredProducts.map((product) => {

                        const cartProduct = cartItems.find(
                            (item) => item.id === product.id
                        );

                        return (
                            <article
                                className="zeit-product-card"
                                key={product.id}
                            >
                                <div className="product-image">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                    />
                                </div>

                                <div className="product-info">

                                    <span className="product-category">
                                        {product.category}
                                    </span>

                                    <h3>{product.name}</h3>

                                    <div className="product-bottom">

                                        <p>
                                            ₹{product.price}
                                            <span> / {product.unit}</span>
                                        </p>

                                        <button
                                            onClick={() => addToCart(product)}
                                        >
                                            {cartProduct
                                                ? `+ Add (${cartProduct.quantity})`
                                                : "+ Add"}
                                        </button>

                                    </div>
                                </div>
                            </article>
                        );
                    })}

                </div>

                {/* View Cart */}
                <div className="view-cart-wrapper">
                    <Link
                        to="/cart"
                        className="view-cart-button"
                    >
                        View Cart ({cartCount}) →
                    </Link>
                </div>

            </section>

            {/* Closing Banner */}
            <section className="zeit-bottom-banner">
                <h2>Make Every Meal a Fresh Start.</h2>
                <p>Bring home freshness with ZEIT.</p>

                <button onClick={scrollToProducts}>
                    Explore Products →
                </button>
            </section>

            <Footer />

        </div>
    );
}

export default Home;
