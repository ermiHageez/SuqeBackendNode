const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
     ssl: {
    rejectUnauthorized: false
  },
});

// ====== USER ROUTES ======
app.post("/api/v1/user/register", async (req, res) => {
  const { telegramId, name, username, phoneNumber, userType } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users (telegram_id, name, username, phone_number, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [telegramId, name, username, phoneNumber, userType]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("User registration failed.");
  }
});

app.get("/api/v1/user/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
    if (result.rows.length === 0) return res.status(404).send("User not found.");
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch user.");
  }
});

// ====== PRODUCT ROUTES ======
app.post("/api/v1/product/add/:sellerUsername", async (req, res) => {
  const { sellerUsername } = req.params;
  const { name, description, price, imageUrl } = req.body;

  try {
    const sellerRes = await pool.query("SELECT * FROM users WHERE username = $1 AND user_type = 'seller'", [sellerUsername]);
    if (sellerRes.rows.length === 0) return res.status(404).send("Seller not found.");

    const sellerId = sellerRes.rows[0].id;
    const result = await pool.query(
      "INSERT INTO products (name, description, price, image_url, seller_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, description, price, imageUrl, sellerId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Product creation failed.");
  }
});

app.get("/api/v1/product/all", async (_req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch products.");
  }
});

app.get("/api/v1/product/seller/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const sellerRes = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (sellerRes.rows.length === 0) return res.status(404).send("Seller not found.");

    const sellerId = sellerRes.rows[0].id;
    const productRes = await pool.query("SELECT * FROM products WHERE seller_id = $1", [sellerId]);
    res.json(productRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch seller products.");
  }
});

// ====== ORDER ROUTES ======
app.post("/api/v1/order", async (req, res) => {
  const { productId, buyerTelegramId } = req.body;

  try {
    const buyerRes = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [buyerTelegramId]);
    if (buyerRes.rows.length === 0) return res.status(404).send("Buyer not found.");

    const buyerId = buyerRes.rows[0].id;

    const orderRes = await pool.query(
      "INSERT INTO orders (product_id, buyer_id) VALUES ($1, $2) RETURNING *",
      [productId, buyerId]
    );
    res.status(201).json(orderRes.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to place order.");
  }
});

app.get("/api/v1/order/buyer/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  try {
    const buyerRes = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
    if (buyerRes.rows.length === 0) return res.status(404).send("Buyer not found.");

    const ordersRes = await pool.query(
      "SELECT * FROM orders WHERE buyer_id = $1",
      [buyerRes.rows[0].id]
    );
    res.json(ordersRes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch orders.");
  }
});


// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
