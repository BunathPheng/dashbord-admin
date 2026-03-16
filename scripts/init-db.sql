-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  sku VARCHAR(100) UNIQUE NOT NULL,
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity_on_hand INT DEFAULT 0,
  quantity_reserved INT DEFAULT 0,
  quantity_available INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  total_spent DECIMAL(10, 2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Discounts Table
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(50) NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL,
  max_uses INT,
  current_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  total_amount DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  shipping_address VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Insert default admin user (password: "admin123" hashed with bcrypt)
INSERT INTO admins (email, password_hash, name, role, is_active)
VALUES (
  'admin@example.com',
  '$2b$10$YOixOjqDnJVDH6K3AqGzHuUBCuLF6ZTv1RdGPWRiV8.99TplxNfxq',
  'Admin User',
  'admin',
  true
) ON CONFLICT DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description, is_active) VALUES
('Electronics', 'Electronic devices and accessories', true),
('Clothing', 'Apparel and fashion items', true),
('Books', 'Physical and digital books', true),
('Home & Garden', 'Home improvement and garden products', true)
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, category_id, price, cost, sku, is_active)
SELECT
  'Wireless Headphones',
  'High-quality wireless headphones with noise cancellation',
  (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1),
  99.99,
  45.00,
  'ELEC-001',
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'ELEC-001')
UNION ALL
SELECT
  'Cotton T-Shirt',
  'Classic cotton t-shirt in multiple colors',
  (SELECT id FROM categories WHERE name = 'Clothing' LIMIT 1),
  24.99,
  8.00,
  'CLOTH-001',
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CLOTH-001')
UNION ALL
SELECT
  'Programming Book',
  'Learn advanced programming concepts',
  (SELECT id FROM categories WHERE name = 'Books' LIMIT 1),
  49.99,
  20.00,
  'BOOK-001',
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'BOOK-001');

-- Insert inventory for sample products
INSERT INTO inventory (product_id, quantity_on_hand, quantity_reserved, quantity_available, low_stock_threshold)
SELECT id, 50, 5, 45, 10 FROM products WHERE sku = 'ELEC-001' AND NOT EXISTS (SELECT 1 FROM inventory WHERE product_id IN (SELECT id FROM products WHERE sku = 'ELEC-001'))
UNION ALL
SELECT id, 100, 20, 80, 30 FROM products WHERE sku = 'CLOTH-001' AND NOT EXISTS (SELECT 1 FROM inventory WHERE product_id IN (SELECT id FROM products WHERE sku = 'CLOTH-001'))
UNION ALL
SELECT id, 30, 5, 25, 10 FROM products WHERE sku = 'BOOK-001' AND NOT EXISTS (SELECT 1 FROM inventory WHERE product_id IN (SELECT id FROM products WHERE sku = 'BOOK-001'));

-- Insert sample customers
INSERT INTO customers (email, first_name, last_name, phone, city, state, country, total_spent, total_orders)
VALUES
('john.doe@example.com', 'John', 'Doe', '+1234567890', 'New York', 'NY', 'USA', 250.00, 3),
('jane.smith@example.com', 'Jane', 'Smith', '+1234567891', 'Los Angeles', 'CA', 'USA', 450.00, 5),
('bob.johnson@example.com', 'Bob', 'Johnson', '+1234567892', 'Chicago', 'IL', 'USA', 120.00, 2)
ON CONFLICT (email) DO NOTHING;

-- Insert sample discounts
INSERT INTO discounts (code, description, discount_type, discount_value, max_uses, is_active)
VALUES
('SUMMER20', '20% off summer sale', 'percentage', 20.00, 100, true),
('SAVE10', 'Save $10 on orders over $100', 'fixed', 10.00, 200, true),
('WELCOME5', 'New customer discount', 'percentage', 5.00, 1000, true)
ON CONFLICT DO NOTHING;
