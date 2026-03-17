/**
 * Mock data for UI development. Set USE_MOCK_DATA=true in .env to use.
 * Login: admin@admin.com / admin123
 */

export const MOCK_STATS = {
  totalRevenue: 45820.5,
  totalOrders: 342,
  totalCustomers: 128,
  totalProducts: 56,
  lowStockProducts: 5,
};

export const MOCK_SALES_DATA = [
  { date: '2025-03-01', revenue: 1250, orders: 12 },
  { date: '2025-03-02', revenue: 980, orders: 9 },
  { date: '2025-03-03', revenue: 2100, orders: 18 },
  { date: '2025-03-04', revenue: 1650, orders: 14 },
  { date: '2025-03-05', revenue: 3200, orders: 22 },
  { date: '2025-03-06', revenue: 1890, orders: 16 },
  { date: '2025-03-07', revenue: 2400, orders: 20 },
  { date: '2025-03-08', revenue: 1100, orders: 10 },
  { date: '2025-03-09', revenue: 2750, orders: 19 },
  { date: '2025-03-10', revenue: 1980, orders: 15 },
  { date: '2025-03-11', revenue: 3100, orders: 21 },
  { date: '2025-03-12', revenue: 1420, orders: 13 },
  { date: '2025-03-13', revenue: 2290, orders: 17 },
  { date: '2025-03-14', revenue: 1850, orders: 14 },
  { date: '2025-03-15', revenue: 2600, orders: 18 },
];

export const MOCK_RECENT_ORDERS = [
  {
    id: '1',
    order_number: 'ORD-2025-001',
    total_amount: 149.99,
    status: 'delivered',
    created_at: '2025-03-15T14:30:00Z',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
  },
  {
    id: '2',
    order_number: 'ORD-2025-002',
    total_amount: 89.5,
    status: 'shipped',
    created_at: '2025-03-14T10:15:00Z',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@example.com',
  },
  {
    id: '3',
    order_number: 'ORD-2025-003',
    total_amount: 234.99,
    status: 'processing',
    created_at: '2025-03-15T09:00:00Z',
    first_name: 'Bob',
    last_name: 'Wilson',
    email: 'bob.wilson@example.com',
  },
  {
    id: '4',
    order_number: 'ORD-2025-004',
    total_amount: 45.99,
    status: 'pending',
    created_at: '2025-03-15T16:45:00Z',
    first_name: 'Alice',
    last_name: 'Brown',
    email: 'alice.brown@example.com',
  },
  {
    id: '5',
    order_number: 'ORD-2025-005',
    total_amount: 312.99,
    status: 'delivered',
    created_at: '2025-03-13T11:20:00Z',
    first_name: 'Charlie',
    last_name: 'Davis',
    email: 'charlie.davis@example.com',
  },
];

export const MOCK_LOW_STOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Wireless Headphones',
    sku: 'WH-001',
    quantity_on_hand: 3,
    low_stock_threshold: 10,
  },
  {
    id: '2',
    name: 'USB-C Cable',
    sku: 'UC-002',
    quantity_on_hand: 5,
    low_stock_threshold: 10,
  },
  {
    id: '3',
    name: 'Wireless Mouse',
    sku: 'WM-003',
    quantity_on_hand: 2,
    low_stock_threshold: 10,
  },
];

export const MOCK_PRODUCTS = [
  { id: '1', name: 'Wireless Headphones', sku: 'WH-001', category_name: 'Electronics', price: 89.99, is_active: true },
  { id: '2', name: 'USB-C Cable', sku: 'UC-002', category_name: 'Accessories', price: 12.99, is_active: true },
  { id: '3', name: 'Wireless Mouse', sku: 'WM-003', category_name: 'Electronics', price: 34.99, is_active: true },
  { id: '4', name: 'Mechanical Keyboard', sku: 'MK-004', category_name: 'Electronics', price: 129.99, is_active: true },
  { id: '5', name: 'Laptop Stand', sku: 'LS-005', category_name: 'Accessories', price: 49.99, is_active: true },
  { id: '6', name: 'Webcam HD', sku: 'WC-006', category_name: 'Electronics', price: 79.99, is_active: true },
  { id: '7', name: 'Desk Lamp', sku: 'DL-007', category_name: 'Office', price: 24.99, is_active: true },
  { id: '8', name: 'Monitor Arm', sku: 'MA-008', category_name: 'Accessories', price: 59.99, is_active: true },
  { id: '9', name: 'Phone Stand', sku: 'PS-009', category_name: 'Accessories', price: 19.99, is_active: true },
  { id: '10', name: 'Bluetooth Speaker', sku: 'BS-010', category_name: 'Electronics', price: 45.99, is_active: true },
];

export const MOCK_ORDERS = [
  { id: '1', order_number: 'ORD-2025-001', first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', total_amount: 149.99, status: 'delivered', payment_status: 'completed', created_at: '2025-03-15T14:30:00Z' },
  { id: '2', order_number: 'ORD-2025-002', first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', total_amount: 89.5, status: 'shipped', payment_status: 'completed', created_at: '2025-03-14T10:15:00Z' },
  { id: '3', order_number: 'ORD-2025-003', first_name: 'Bob', last_name: 'Wilson', email: 'bob.wilson@example.com', total_amount: 234.99, status: 'processing', payment_status: 'pending', created_at: '2025-03-15T09:00:00Z' },
  { id: '4', order_number: 'ORD-2025-004', first_name: 'Alice', last_name: 'Brown', email: 'alice.brown@example.com', total_amount: 45.99, status: 'pending', payment_status: 'pending', created_at: '2025-03-15T16:45:00Z' },
  { id: '5', order_number: 'ORD-2025-005', first_name: 'Charlie', last_name: 'Davis', email: 'charlie.davis@example.com', total_amount: 312.99, status: 'delivered', payment_status: 'completed', created_at: '2025-03-13T11:20:00Z' },
  { id: '6', order_number: 'ORD-2025-006', first_name: 'Diana', last_name: 'Lee', email: 'diana.lee@example.com', total_amount: 78.5, status: 'shipped', payment_status: 'completed', created_at: '2025-03-12T08:30:00Z' },
  { id: '7', order_number: 'ORD-2025-007', first_name: 'Eve', last_name: 'Martinez', email: 'eve.martinez@example.com', total_amount: 199.99, status: 'delivered', payment_status: 'completed', created_at: '2025-03-11T15:00:00Z' },
  { id: '8', order_number: 'ORD-2025-008', first_name: 'Frank', last_name: 'Taylor', email: 'frank.taylor@example.com', total_amount: 55.99, status: 'cancelled', payment_status: 'refunded', created_at: '2025-03-10T12:45:00Z' },
  { id: '9', order_number: 'ORD-2025-009', first_name: 'Grace', last_name: 'Anderson', email: 'grace.anderson@example.com', total_amount: 167.5, status: 'processing', payment_status: 'completed', created_at: '2025-03-09T09:20:00Z' },
  { id: '10', order_number: 'ORD-2025-010', first_name: 'Henry', last_name: 'Clark', email: 'henry.clark@example.com', total_amount: 92.99, status: 'pending', payment_status: 'pending', created_at: '2025-03-08T14:10:00Z' },
];

export const MOCK_CUSTOMERS = [
  { id: '1', email: 'john.doe@example.com', first_name: 'John', last_name: 'Doe', phone: '+1 555-0101', city: 'New York', state: 'NY', country: 'USA', total_spent: 1245.99, total_orders: 12, created_at: '2024-01-15T10:00:00Z' },
  { id: '2', email: 'jane.smith@example.com', first_name: 'Jane', last_name: 'Smith', phone: '+1 555-0102', city: 'Los Angeles', state: 'CA', country: 'USA', total_spent: 892.5, total_orders: 8, created_at: '2024-02-20T14:30:00Z' },
  { id: '3', email: 'bob.wilson@example.com', first_name: 'Bob', last_name: 'Wilson', phone: '+1 555-0103', city: 'Chicago', state: 'IL', country: 'USA', total_spent: 2340.99, total_orders: 22, created_at: '2024-01-08T09:15:00Z' },
  { id: '4', email: 'alice.brown@example.com', first_name: 'Alice', last_name: 'Brown', phone: '+1 555-0104', city: 'Houston', state: 'TX', country: 'USA', total_spent: 456.75, total_orders: 5, created_at: '2024-03-01T11:45:00Z' },
  { id: '5', email: 'charlie.davis@example.com', first_name: 'Charlie', last_name: 'Davis', phone: '+1 555-0105', city: 'Phoenix', state: 'AZ', country: 'USA', total_spent: 1789.25, total_orders: 15, created_at: '2024-02-12T16:20:00Z' },
  { id: '6', email: 'diana.lee@example.com', first_name: 'Diana', last_name: 'Lee', phone: '+1 555-0106', city: 'Seattle', state: 'WA', country: 'USA', total_spent: 567.99, total_orders: 6, created_at: '2024-03-05T08:00:00Z' },
  { id: '7', email: 'eve.martinez@example.com', first_name: 'Eve', last_name: 'Martinez', phone: '+1 555-0107', city: 'Denver', state: 'CO', country: 'USA', total_spent: 934.5, total_orders: 9, created_at: '2024-01-22T13:30:00Z' },
  { id: '8', email: 'frank.taylor@example.com', first_name: 'Frank', last_name: 'Taylor', phone: '+1 555-0108', city: 'Boston', state: 'MA', country: 'USA', total_spent: 1234.99, total_orders: 11, created_at: '2024-02-28T10:15:00Z' },
  { id: '9', email: 'grace.anderson@example.com', first_name: 'Grace', last_name: 'Anderson', phone: '+1 555-0109', city: 'Miami', state: 'FL', country: 'USA', total_spent: 678.25, total_orders: 7, created_at: '2024-03-10T15:45:00Z' },
  { id: '10', email: 'henry.clark@example.com', first_name: 'Henry', last_name: 'Clark', phone: '+1 555-0110', city: 'Atlanta', state: 'GA', country: 'USA', total_spent: 1456.5, total_orders: 14, created_at: '2024-01-30T12:00:00Z' },
];

export const MOCK_CATEGORIES = [
  { id: '1', name: 'Electronics', description: 'Electronic devices and gadgets' },
  { id: '2', name: 'Accessories', description: 'Device accessories and peripherals' },
  { id: '3', name: 'Office', description: 'Office supplies and equipment' },
  { id: '4', name: 'Clothing', description: 'Apparel and fashion items' },
];

export const MOCK_INVENTORY = [
  { id: '1', product_id: '1', product_name: 'Wireless Headphones', sku: 'WH-001', quantity_on_hand: 3, quantity_reserved: 0, quantity_available: 3, low_stock_threshold: 10 },
  { id: '2', product_id: '2', product_name: 'USB-C Cable', sku: 'UC-002', quantity_on_hand: 5, quantity_reserved: 1, quantity_available: 4, low_stock_threshold: 10 },
  { id: '3', product_id: '3', product_name: 'Wireless Mouse', sku: 'WM-003', quantity_on_hand: 2, quantity_reserved: 0, quantity_available: 2, low_stock_threshold: 10 },
  { id: '4', product_id: '4', product_name: 'Mechanical Keyboard', sku: 'MK-004', quantity_on_hand: 45, quantity_reserved: 2, quantity_available: 43, low_stock_threshold: 10 },
  { id: '5', product_id: '5', product_name: 'Laptop Stand', sku: 'LS-005', quantity_on_hand: 28, quantity_reserved: 0, quantity_available: 28, low_stock_threshold: 5 },
  { id: '6', product_id: '6', product_name: 'Webcam HD', sku: 'WC-006', quantity_on_hand: 15, quantity_reserved: 1, quantity_available: 14, low_stock_threshold: 5 },
  { id: '7', product_id: '7', product_name: 'Desk Lamp', sku: 'DL-007', quantity_on_hand: 62, quantity_reserved: 0, quantity_available: 62, low_stock_threshold: 10 },
  { id: '8', product_id: '8', product_name: 'Monitor Arm', sku: 'MA-008', quantity_on_hand: 18, quantity_reserved: 0, quantity_available: 18, low_stock_threshold: 5 },
  { id: '9', product_id: '9', product_name: 'Phone Stand', sku: 'PS-009', quantity_on_hand: 35, quantity_reserved: 0, quantity_available: 35, low_stock_threshold: 10 },
  { id: '10', product_id: '10', product_name: 'Bluetooth Speaker', sku: 'BS-010', quantity_on_hand: 22, quantity_reserved: 1, quantity_available: 21, low_stock_threshold: 5 },
];

export const MOCK_DISCOUNTS = [
  { id: '1', code: 'WELCOME10', description: 'Welcome discount for new customers', discount_type: 'percentage' as const, discount_value: 10, max_uses: 1000, current_uses: 234, is_active: true, start_date: '2025-01-01', end_date: '2025-12-31' },
  { id: '2', code: 'SAVE20', description: '20% off on orders over $100', discount_type: 'percentage' as const, discount_value: 20, max_uses: 500, current_uses: 89, is_active: true, start_date: '2025-03-01', end_date: '2025-03-31' },
  { id: '3', code: 'FLAT15', description: '$15 off your order', discount_type: 'fixed' as const, discount_value: 15, max_uses: null, current_uses: 156, is_active: true, start_date: null, end_date: null },
  { id: '4', code: 'SUMMER25', description: 'Summer sale 25% off', discount_type: 'percentage' as const, discount_value: 25, max_uses: 200, current_uses: 200, is_active: false, start_date: '2024-06-01', end_date: '2024-08-31' },
];

export const MOCK_ORDER_DETAIL = {
  order: {
    id: '1',
    order_number: 'ORD-2025-001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    status: 'delivered',
    payment_status: 'completed',
    total_amount: 149.99,
    subtotal: 129.99,
    tax: 10.4,
    shipping_cost: 9.6,
    discount_amount: 0,
    shipping_address: '123 Main St, Apt 4B, New York, NY 10001',
    notes: 'Please leave at door',
    created_at: '2025-03-15T14:30:00Z',
  },
  items: [
    { id: '1', product_name: 'Wireless Headphones', quantity: 1, unit_price: 89.99, total_price: 89.99 },
    { id: '2', product_name: 'USB-C Cable', quantity: 2, unit_price: 12.99, total_price: 25.98 },
    { id: '3', product_name: 'Phone Stand', quantity: 1, unit_price: 19.99, total_price: 19.99 },
  ],
};

export const MOCK_CUSTOMER_DETAIL = {
  customer: {
    id: '1',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1 555-0101',
    address: '123 Main St, Apt 4B',
    city: 'New York',
    state: 'NY',
    zip_code: '10001',
    country: 'USA',
    total_spent: 1245.99,
    total_orders: 12,
    created_at: '2024-01-15T10:00:00Z',
  },
  orders: [
    { id: '1', order_number: 'ORD-2025-001', total_amount: 149.99, status: 'delivered', created_at: '2025-03-15T14:30:00Z' },
    { id: '2', order_number: 'ORD-2024-098', total_amount: 89.5, status: 'delivered', created_at: '2025-02-20T10:15:00Z' },
    { id: '3', order_number: 'ORD-2024-087', total_amount: 234.99, status: 'delivered', created_at: '2025-01-15T09:00:00Z' },
  ],
};

export function isMockMode(): boolean {
  return false; // Mock data disabled - use API_URL backend or DATABASE_URL
}
