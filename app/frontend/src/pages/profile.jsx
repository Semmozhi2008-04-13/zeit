import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";
import jsPDF from "jspdf";
import "./profile.css";

function Profile() {
  const navigate = useNavigate();
  
  // Main States
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile"); // "profile" or "orders"

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "", email: "", address: "" });
  const [saveLoading, setSaveLoading] = useState(false);

  // Order History States
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("zeit-token")) {
      navigate("/login");
      return;
    }
    
    // Fetch Profile Data
    apiRequest("/auth/profile")
      .then((data) => {
        setUser(data.user);
        setEditData({
          name: data.user.name || "",
          phone: data.user.phone || "",
          email: data.user.email || "",
          address: data.user.address || "",
        });
      })
      .catch((err) => {
        setError(err.message);
        if (err.message.toLowerCase().includes("session")) {
          localStorage.removeItem("zeit-token");
          localStorage.removeItem("zeit-user");
          navigate("/login");
        }
      });

    // Fetch Order History
    // NOTE: You will need to create this endpoint in your backend!
    apiRequest("/orders")
      .then((data) => {
        setOrders(data.orders || []);
      })
      .catch((err) => {
        setOrdersError(err.message || "Could not load order history.");
      })
      .finally(() => {
        setOrdersLoading(false);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("zeit-token");
    localStorage.removeItem("zeit-user");
    localStorage.removeItem("zeit-cart");
    navigate("/login");
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaveLoading(true);
    setError("");
    try {
      const data = await apiRequest("/auth/profile", {
        method: "PUT", 
        body: JSON.stringify(editData),
      });
      setUser(data.user);
      localStorage.setItem("zeit-user", JSON.stringify(data.user));
      setIsEditing(false);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      address: user.address || "",
    });
    setIsEditing(false);
    setError("");
  };

  // --- PDF BILL GENERATION FOR PAST ORDERS ---
  const downloadBill = (order) => {
    const doc = new jsPDF();
    const invoiceNumber = order._id || `ZEIT-${Date.now()}`;
    const billDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN");

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(23, 75, 50);
    doc.text("ZEIT", 20, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Freshness delivered to your doorstep", 20, 30);

    // Invoice details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(23, 75, 50);
    doc.text("ORDER BILL", 20, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Invoice No: ${invoiceNumber}`, 20, 60);
    doc.text(`Date: ${billDate}`, 20, 67);

    // Table Header
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

    // Product Rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    order.items.forEach((item) => {
      const productName = doc.splitTextToSize(item.name || "Product", 75);
      if (y + productName.length * 6 > 260) {
        doc.addPage();
        y = 25;
      }
      doc.text(productName, 24, y);
      doc.text(String(item.quantity), 105, y);
      doc.text(`Rs. ${item.price}`, 130, y);
      doc.text(`Rs. ${Number(item.price) * Number(item.quantity)}`, 160, y);
      y += Math.max(productName.length * 6, 12);
    });

    // Summary
    if (y > 240) { doc.addPage(); y = 30; }
    y += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, 190, y);
    y += 12;
    doc.setFontSize(11);
    doc.text(`Subtotal: Rs. ${order.subtotal || order.total}`, 130, y);
    y += 9;
    doc.text(`Delivery Fee: ${order.deliveryFee === 0 ? "FREE" : `Rs. ${order.deliveryFee || 0}`}`, 130, y);
    y += 13;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(23, 75, 50);
    doc.text(`Grand Total: Rs. ${order.total}`, 130, y);

    // Footer
    y += 25;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Thank you for shopping with ZEIT!", 105, y, { align: "center" });

    doc.save(`Bill-${invoiceNumber}.pdf`);
  };

  return (
    <div className="profile-page">
      
      {/* Sidebar */}
      <div className="profile-sidebar">
        <div className="profile-photo">
          <img src="/profile.jpg" alt="Profile" onError={(e) => { e.target.style.display = "none"; }} />
          <span className="profile-photo-placeholder">👤</span>
        </div>
        
        {/* Navigation Menu */}
        <div className="profile-nav">
          <button 
            className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Personal Info
          </button>
          <button 
            className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            📦 Order History
          </button>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        
        {/* TAB 1: PROFILE INFO */}
        {activeTab === "profile" && (
          <>
            <div className="profile-header">
              <div>
                <h1>My Profile</h1>
                <p className="profile-subtitle">Manage your personal information</p>
              </div>
              {!isEditing && user && (
                <button className="edit-btn" onClick={() => setIsEditing(true)}>
                  ✎ Edit Profile
                </button>
              )}
              {isEditing && (
                <div className="edit-actions">
                  <button className="cancel-btn" onClick={handleCancel} disabled={saveLoading}>Cancel</button>
                  <button className="save-btn" onClick={handleSave} disabled={saveLoading}>
                    {saveLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            {error && <p className="error">{error}</p>}

            {!user ? (
              <p>Loading profile...</p>
            ) : (
              <div className="profile-details">
                <div className="profile-field">
                  <label>Name</label>
                  {isEditing ? <input type="text" name="name" value={editData.name} onChange={handleChange} /> : <p>{user.name || "Not available"}</p>}
                </div>
                <div className="profile-field">
                  <label>Phone Number</label>
                  {isEditing ? <input type="tel" name="phone" value={editData.phone} onChange={handleChange} /> : <p>{user.phone || "Not available"}</p>}
                </div>
                <div className="profile-field">
                  <label>Email</label>
                  <p>{user.email || "Not available"}</p> {/* Email usually non-editable */}
                </div>
                <div className="profile-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Address</label>
                  {isEditing ? <textarea name="address" value={editData.address} onChange={handleChange} rows="2" /> : <p>{user.address || "Not available"}</p>}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: ORDER HISTORY */}
        {activeTab === "orders" && (
          <>
            <div className="profile-header">
              <div>
                <h1>Order History</h1>
                <p className="profile-subtitle">View and download your past bills</p>
              </div>
            </div>

            {ordersError && <p className="error">{ordersError}</p>}
            
            {ordersLoading ? (
              <p>Loading your orders...</p>
            ) : orders.length === 0 ? (
              <div className="empty-orders">
                <span style={{ fontSize: "40px" }}>🛒</span>
                <h3>No orders yet</h3>
                <p>You haven't placed any orders. Start shopping to see them here!</p>
              </div>
            ) : (
              <div className="order-list">
                {orders.map((order) => (
                  <div className="order-card" key={order._id}>
                    <div className="order-card-header">
                      <div>
                        <strong>Order #{order._id?.slice(-6).toUpperCase()}</strong>
                        <span className="order-date">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <span className={`status-badge ${order.status?.toLowerCase() || 'delivered'}`}>
                        {order.status || "Delivered"}
                      </span>
                    </div>
                    
                    <div className="order-card-body">
                      <p>{order.items?.length || 0} Items</p>
                      <strong>₹{order.total}</strong>
                    </div>

                    <div className="order-card-footer">
                      <button className="download-btn" onClick={() => downloadBill(order)}>
                        ⬇ Download Bill (PDF)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

export default Profile;