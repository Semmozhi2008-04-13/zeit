require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/authRoutes');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random string of at least 32 characters.');
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(',').map(v => v.trim());
app.use(cors({ origin: (origin, callback) => !origin || allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Origin not allowed by CORS')) }));
app.use(express.json({ limit: '1mb' }));
app.use('/api/auth', authRoutes);
app.get('/', (req, res) => res.send('ZEIT API Server is running. Visit /api/health'));
app.get('/api/health', (req, res) => res.json({ success: true, message: 'ZEIT backend is running!' }));
app.get('/api/db-test', async (req, res) => {
  try { const [rows] = await pool.query('SELECT DATABASE() AS database_name'); res.json({ success: true, message: 'MySQL connected successfully', database: rows[0].database_name }); }
  catch (error) { console.error('Database test:', error.code || error.message); res.status(500).json({ success: false, message: 'MySQL connection failed', errorCode: error.code || 'UNKNOWN_ERROR' }); }
});

// 3. Get cart products using JOIN
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const [rows] = await pool.execute(
            `SELECT
                p.product_id,
                p.description AS product_name,
                p.weight,
                p.price AS unit_price,
                c.quantity,
                (p.price * c.quantity) AS item_subtotal
             FROM cart c
             JOIN product p
                ON c.product_id = p.product_id
             WHERE c.user_id = ?`,
            [userId]
        );

        res.json({
            success: true,
            items: rows
        });
    } catch (error) {
        console.error('Cart query error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to retrieve cart'
        });
    }
});

// 3. Get cart products using JOIN


 // Get all products
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await pool.execute(
            `SELECT
                product_id,
                description,
                weight,
                price,
                stock_quantity
             FROM product`
        );

        res.json({
            success: true,
            products: products
        });
    } catch (error) {
        console.error('Product listing error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to retrieve products'
        });
    }
});


app.post('/api/cart', async (req, res) => {
    const userId = Number(req.body.user_id);
    const productId = Number(req.body.product_id);
    const quantity = Number(req.body.quantity);

    if (
        !Number.isInteger(userId) || userId <= 0 ||
        !Number.isInteger(productId) || productId <= 0 ||
        !Number.isInteger(quantity) || quantity <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Valid user_id, product_id and quantity are required'
        });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [products] = await connection.execute(
            `SELECT product_id, stock_quantity
             FROM product
             WHERE product_id = ?
             FOR UPDATE`,
            [productId]
        );

        if (products.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const stock = Number(products[0].stock_quantity);

        if (!Number.isInteger(stock) || stock < 0) {
            await connection.rollback();

            return res.status(500).json({
                success: false,
                message: 'Invalid product stock data'
            });
        }

        const [cartItems] = await connection.execute(
            `SELECT quantity
             FROM cart
             WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );

        const existingQuantity = cartItems.length
            ? Number(cartItems[0].quantity)
            : 0;

        if (existingQuantity + quantity > stock) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
                available_stock: stock
            });
        }

        if (cartItems.length > 0) {
            await connection.execute(
                `UPDATE cart
                 SET quantity = quantity + ?
                 WHERE user_id = ? AND product_id = ?`,
                [quantity, userId, productId]
            );
        } else {
            await connection.execute(
                `INSERT INTO cart (user_id, product_id, quantity)
                 VALUES (?, ?, ?)`,
                [userId, productId, quantity]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Product added to cart'
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Add cart error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to add product to cart'
        });
    } finally {
        if (connection) connection.release();
    }
});


app.patch('/api/cart/:productId', async (req, res) => {
    const userId = Number(req.body.user_id);
    const productId = Number(req.params.productId);
    const quantity = Number(req.body.quantity);

    if (
        !Number.isInteger(userId) || userId <= 0 ||
        !Number.isInteger(productId) || productId <= 0 ||
        !Number.isInteger(quantity) || quantity <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Valid user_id, productId and positive quantity are required'
        });
    }

    try {
        const [products] = await pool.execute(
            `SELECT stock_quantity
             FROM product
             WHERE product_id = ?`,
            [productId]
        );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const stock = Number(products[0].stock_quantity);

        if (!Number.isInteger(stock) || stock < 0) {
            return res.status(500).json({
                success: false,
                message: 'Invalid product stock data'
            });
        }

        if (quantity > stock) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock',
                available_stock: stock
            });
        }

        const [result] = await pool.execute(
            `UPDATE cart
             SET quantity = ?
             WHERE user_id = ? AND product_id = ?`,
            [quantity, userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        res.json({
            success: true,
            message: 'Cart quantity updated'
        });
    } catch (error) {
        console.error('Update cart error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to update cart'
        });
    }
});


app.delete('/api/cart/:productId', async (req, res) => {
    const userId = Number(req.body.user_id);
    const productId = Number(req.params.productId);

    if (
        !Number.isInteger(userId) || userId <= 0 ||
        !Number.isInteger(productId) || productId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Valid user_id and productId are required'
        });
    }

    try {
        const [result] = await pool.execute(
            `DELETE FROM cart
             WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found'
            });
        }

        res.json({
            success: true,
            message: 'Cart item removed'
        });
    } catch (error) {
        console.error('Delete cart error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to remove cart item'
        });
    }
});


app.post('/api/bills', async (req, res) => {
    const userId = Number(req.body.user_id);
    const addressId = Number(req.body.address_id);

    if (
        !Number.isInteger(userId) || userId <= 0 ||
        !Number.isInteger(addressId) || addressId <= 0
    ) {
        return res.status(400).json({
            success: false,
            message: 'Valid user_id and address_id are required'
        });
    }

    let connection;

    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Confirm that the address belongs to this user
        const [addresses] = await connection.execute(
            `SELECT address_id
             FROM address
             WHERE address_id = ? AND user_id = ?`,
            [addressId, userId]
        );

        if (addresses.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Invalid address for this user'
            });
        }

        // Lock cart rows and retrieve current product prices
        const [items] = await connection.execute(
            `SELECT
                c.product_id,
                c.quantity,
                p.description AS product_name,
                p.price AS unit_price,
                p.stock_quantity
             FROM cart c
             JOIN product p ON p.product_id = c.product_id
             WHERE c.user_id = ?
             FOR UPDATE`,
            [userId]
        );

        if (items.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: 'Cannot create a bill for an empty cart'
            });
        }

        let subtotal = 0;

        for (const item of items) {
            const price = Number(item.unit_price);
            const quantity = Number(item.quantity);
            const stock = Number(item.stock_quantity);

            if (
                !Number.isFinite(price) || price < 0 ||
                !Number.isInteger(quantity) || quantity <= 0 ||
                !Number.isInteger(stock) || stock < quantity
            ) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: 'Invalid price, quantity or insufficient stock'
                });
            }

            item.item_subtotal = price * quantity;
            subtotal += item.item_subtotal;
        }

        // No tax or delivery fee is applied in this version
        const totalAmount = subtotal;
        const billNumber =
            'ZEIT-' + Date.now() + '-' +
            Math.floor(Math.random() * 10000);

        const [billResult] = await connection.execute(
            `INSERT INTO bill
                (bill_number, user_id, address_id,
                 subtotal, total_amount, bill_status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                billNumber,
                userId,
                addressId,
                subtotal,
                totalAmount,
                'Created'
            ]
        );

        const billId = billResult.insertId;

        for (const item of items) {
            await connection.execute(
                `INSERT INTO bill_item
                    (bill_id, product_id, product_name,
                     quantity, unit_price, item_subtotal)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    billId,
                    item.product_id,
                    item.product_name,
                    item.quantity,
                    item.unit_price,
                    item.item_subtotal
                ]
            );

            // Reserve/sell the quantity by reducing stock
            await connection.execute(
                `UPDATE product
                 SET stock_quantity = stock_quantity - ?
                 WHERE product_id = ?`,
                [item.quantity, item.product_id]
            );
        }

        // Clear cart after successful bill creation
        await connection.execute(
            `DELETE FROM cart WHERE user_id = ?`,
            [userId]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Bill created successfully',
            bill_id: billId,
            bill_number: billNumber,
            subtotal: subtotal,
            total_amount: totalAmount
        });
    } catch (error) {
        if (connection) await connection.rollback();

        console.error('Create bill error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to create bill'
        });
    } finally {
        if (connection) connection.release();
    }
});

app.get('/api/bills/:userId', async (req, res) => {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid user ID'
        });
    }

    try {
        const [bills] = await pool.execute(
            `SELECT
                bill_id,
                bill_number,
                bill_date,
                subtotal,
                total_amount,
                bill_status
             FROM bill
             WHERE user_id = ?
             ORDER BY bill_date DESC`,
            [userId]
        );

        res.json({
            success: true,
            bills: bills
        });
    } catch (error) {
        console.error('Bill history error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to retrieve bill history'
        });
    }
});



app.use((req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));
app.use((error, req, res, next) => {
  console.error('Unhandled API error:', error.message);
  res.status(500).json({ success: false, message: 'Unexpected server error.' });
});

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connection successful. Database:', process.env.DB_NAME || 'zeit');
    app.listen(PORT, () => console.log(`ZEIT backend running at http://localhost:${PORT}`));
  } catch (error) {
    console.error('MySQL connection failed:', error.code || error.message);
    process.exit(1);
  }
}
startServer();
