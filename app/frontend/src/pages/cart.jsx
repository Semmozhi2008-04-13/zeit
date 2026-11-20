
import { useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

import Header from "../components/Header";
import Footer from "../components/footer";
import "./Cart.css";

function Cart() {
  // Get cart products from localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("zeit-cart") || "[]");
    } catch {
      return [];
    }
  });

  // Update cart
  const updateCart = (updatedCart) => {
    setCartItems(updatedCart);
    localStorage.setItem("zeit-cart", JSON.stringify(updatedCart));
  };

  // Increase quantity
  const increaseQuantity = (id) => {
    const updatedCart = cartItems.map((item) =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );

    updateCart(updatedCart);
  };

  // Decrease quantity
  const decreaseQuantity = (id) => {
    const updatedCart = cartItems
      .map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0);

    updateCart(updatedCart);
  };

  // Remove product
  const removeItem = (id) => {
    const updatedCart = cartItems.filter(
      (item) => item.id !== id
    );

    updateCart(updatedCart);
  };

  // Calculate subtotal
  const subtotal = cartItems.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity),
    0
  );

  // Delivery fee
  const deliveryFee =
    subtotal === 0 || subtotal >= 499 ? 0 : 40;

  // Final total
  const total = subtotal + deliveryFee;

  // Total product quantity
  const totalItems = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  // Generate PDF Bill
  const generateBill = () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const doc = new jsPDF();

    const invoiceNumber = `ZEIT-${Date.now()}`;
    const billDate = new Date().toLocaleDateString("en-IN");

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(23, 75, 50);
    doc.text("ZEIT", 20, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Freshness delivered to your doorstep", 20, 30);

    // Invoice title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(23, 75, 50);
    doc.text("ORDER BILL", 20, 48);

    // Invoice details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    doc.text(`Invoice No: ${invoiceNumber}`, 20, 60);
    doc.text(`Date: ${billDate}`, 20, 67);

    // Table header
    let y = 85;

    doc.setFillColor(23, 75, 50);
    doc.rect(20, y - 7, 170, 12, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);

    doc.text("Product", 24, y);
    doc.text("Qty", 105, y);
    doc.text("Price", 130, y);
    doc.text("Amount", 160, y);

    y += 15;

    // Product rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);

    cartItems.forEach((item) => {
      const productName = doc.splitTextToSize(
        item.name || "Product",
        75
      );

      if (y + productName.length * 6 > 260) {
        doc.addPage();
        y = 25;
      }

      doc.text(productName, 24, y);
      doc.text(String(item.quantity), 105, y);
      doc.text(`Rs. ${item.price}`, 130, y);
      doc.text(
        `Rs. ${Number(item.price) * Number(item.quantity)}`,
        160,
        y
      );

      y += Math.max(productName.length * 6, 12);
    });

    // Summary
    if (y > 240) {
      doc.addPage();
      y = 30;
    }

    y += 8;

    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);

    y += 12;

    doc.setFontSize(11);
    doc.text(`Subtotal: Rs. ${subtotal}`, 130, y);

    y += 9;

    doc.text(
      `Delivery Fee: ${deliveryFee === 0 ? "FREE" : `Rs. ${deliveryFee}`}`,
      130,
      y
    );

    y += 13;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(23, 75, 50);

    doc.text(`Grand Total: Rs. ${total}`, 130, y);

    // Footer
    y += 25;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    doc.text(
      "Thank you for shopping with ZEIT!",
      105,
      y,
      { align: "center" }
    );

    doc.text(
      "Freshness guaranteed with every order.",
      105,
      y + 7,
      { align: "center" }
    );

    // Download PDF
    doc.save(`${invoiceNumber}.pdf`);
  };

  return (
    <div className="zeit-cart-page">

      <Header cartCount={totalItems} />

      <main className="zeit-cart">

        {/* Page Heading */}
        <div className="cart-heading">
          <h1>My Shopping Cart</h1>
          <p>Your fresh picks, ready for delivery.</p>
        </div>

        {cartItems.length === 0 ? (

          /* Empty Cart */
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>

            <h2>Your cart is empty</h2>

            <p>
              Looks like you haven't added anything yet.
            </p>

            <Link
              to="/home"
              className="continue-shopping"
            >
              Continue Shopping
            </Link>
          </div>

        ) : (

          /* Cart Content */
          <div className="cart-layout">

            {/* Cart Products */}
            <section className="cart-items">

              <div className="cart-items-heading">
                <h2>Cart Items ({totalItems})</h2>

                <Link to="/home">
                  Continue Shopping
                </Link>
              </div>

              {cartItems.map((item) => (

                <div className="cart-item" key={item.id}>

                  <div className="cart-item-image">
                    <img
                      src={item.image}
                      alt={item.name}
                    />
                  </div>

                  <div className="cart-item-details">

                    <h3>{item.name}</h3>

                    <p>
                      ₹{item.price} / {item.unit}
                    </p>

                    <div className="cart-item-actions">

                      {/* Quantity */}
                      <div className="quantity-control">

                        <button
                          onClick={() =>
                            decreaseQuantity(item.id)
                          }
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            increaseQuantity(item.id)
                          }
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>

                      </div>

                      {/* Remove */}
                      <button
                        className="remove-item"
                        onClick={() =>
                          removeItem(item.id)
                        }
                      >
                        Remove
                      </button>

                    </div>
                  </div>

                  {/* Product Total */}
                  <div className="cart-item-total">
                    ₹{item.price * item.quantity}
                  </div>

                </div>

              ))}

            </section>

            {/* Order Summary */}
            <aside className="cart-summary">

              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Items ({totalItems})</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="summary-row">
                <span>Delivery Fee</span>

                <span>
                  {deliveryFee === 0
                    ? "FREE"
                    : `₹${deliveryFee}`}
                </span>
              </div>

              {subtotal > 0 && subtotal < 499 && (
                <p className="delivery-message">
                  Add ₹{499 - subtotal} more for free delivery!
                </p>
              )}

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>
                <strong>₹{total}</strong>
              </div>

              {/* PDF Bill Button */}
              <button
                className="checkout-button"
                onClick={generateBill}
                disabled={cartItems.length === 0}
              >
                Download Bill (PDF) ↓
              </button>

              <p className="secure-message">
                Freshness guaranteed with every order.
              </p>

            </aside>

          </div>
        )}

      </main>

      <Footer />

    </div>
  );
}

export default Cart;
