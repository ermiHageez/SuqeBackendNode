CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id VARCHAR(50) UNIQUE,
  name VARCHAR(100),
  username VARCHAR(100),
  phone_number VARCHAR(20),
  user_type VARCHAR(10) -- 'buyer' or 'seller'
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  price NUMERIC(10,2),
  image TEXT,
  seller_id INTEGER REFERENCES users(id)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  buyer_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
