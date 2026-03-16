# Admin UI ↔ E-Commerce-Mobile-API Backend Mapping

This document compares what the **Admin UI** expects vs what the **E-Commerce-Mobile-API** backend provides, and what needs to be added or changed.

---

## Summary

| Area | Admin UI Needs | Backend Has | Action |
|------|----------------|-------------|--------|
| **Auth** | Admin login (admins table) | User JWT login (users table) | Add admin auth or adapt |
| **Products** | CRUD, SKU, category_id | CRUD, category enum | Add categories, SKU; align schema |
| **Categories** | Full CRUD | ❌ None | **Add new** |
| **Customers** | List, detail, orders | ❌ None (only users) | **Add new** or map users |
| **Orders** | All orders, pagination, status filter | User orders only | **Add admin orders API** |
| **Inventory** | Stock levels, low stock | ❌ None | **Add new** |
| **Discounts** | Promo codes (code, %, fixed) | Product-level discount only | **Add new** or extend |

---

## 1. Auth

| Admin UI | Backend | Notes |
|----------|---------|-------|
| POST `/api/auth/verify` → `{ email, password }` | POST `/api/v1/auths/login` → `{ email, password }` | Backend returns JWT. Admin uses separate `admins` table. |

**Options:**
- **A)** Add admin login to backend: `POST /api/v1/auths/admin/login` using `admins` table
- **B)** Keep Admin UI using its own NextAuth + admins table (current mock mode)
- **C)** Use backend users; add `role` field and treat some users as admins

---

## 2. Products

| Admin UI Expects | Backend Has | Gap |
|-----------------|-------------|-----|
| `id`, `name`, `sku`, `category_name`, `price`, `is_active` | `id`, `name`, `description`, `price`, `imageUrl`, `sizeOptions`, `category` (enum), `discountPercentage` | No SKU, no `category_id`, category is enum not table |
| `category_id` (UUID) | `category` (enum: ELECTRONICS, etc.) | Different model |

**Backend changes:**
- Add `sku` (unique) to products
- Add `categories` table + `category_id` FK, or map enum to category names for Admin
- Add `is_active` (or equivalent) if not present

---

## 3. Categories — **MISSING IN BACKEND**

Admin UI needs:
- `GET /api/categories/all` → `[{ id, name, description }]`
- `POST /api/categories` → create
- `PUT /api/categories/{id}` → update
- `DELETE /api/categories/{id}` → soft delete

**Backend:** Add full Categories CRUD:
- `GET /api/v1/categories` — list all
- `POST /api/v1/categories` — create
- `GET /api/v1/categories/{id}` — get one
- `PUT /api/v1/categories/{id}` — update
- `DELETE /api/v1/categories/{id}` — delete

---

## 4. Customers — **MISSING IN BACKEND**

Admin UI needs:
- `GET /api/customers?page&limit&search` → `{ customers, total }`
- `GET /api/customers/{id}` → `{ customer, orders }`

**Backend:** Either:
- **A)** Add `customers` table and CRUD (aligned with Admin schema)
- **B)** Expose `users` as customers: `GET /api/v1/users` (admin-only), with `total_spent`, `total_orders` derived from orders

---

## 5. Orders — **PARTIAL MATCH**

| Admin UI Expects | Backend Has | Gap |
|-----------------|-------------|-----|
| All orders (admin view) | User's own orders only | Need admin orders endpoint |
| `order_number`, `first_name`, `last_name`, `email`, `total_amount`, `status`, `payment_status`, `created_at` | `id`, `user`, `product`, `quantity`, `totalAmount`, `status`, `address`, etc. | Different structure; backend has 1 product per order |
| Status: pending, processing, shipped, delivered, cancelled | Status: PENDING, SHIPPED, DELIVERED | Add processing, cancelled |
| `PUT /api/orders/{id}` body: `{ status }` | `PATCH /api/v1/orders/{id}/status?status=` | Similar; need admin list |

**Backend changes:**
- Add `GET /api/v1/orders/admin` (or similar) — all orders, pagination, status filter
- Add `processing` and `cancelled` to OrderStatus
- Consider `order_number` if Admin expects it

---

## 6. Inventory — **MISSING IN BACKEND**

Admin UI needs:
- `GET /api/inventory?page&limit&lowStockOnly` → `{ inventory, total }`
- `PUT /api/inventory/{productId}` → update `quantity_on_hand`, `quantity_reserved`, `low_stock_threshold`

**Backend:** Add:
- `inventory` table: `product_id`, `quantity_on_hand`, `quantity_reserved`, `low_stock_threshold`
- `GET /api/v1/inventory` — list with filters
- `PUT /api/v1/inventory/products/{productId}` — update stock

---

## 7. Discounts — **MISSING IN BACKEND**

Admin UI needs promo codes:
- `GET /api/discounts?page&limit` → `{ discounts, total }`
- `POST /api/discounts` — create
- `GET /api/discounts/{id}` — get one
- `PUT /api/discounts/{id}` — update
- `DELETE /api/discounts/{id}` — delete

Fields: `code`, `description`, `discount_type` (percentage|fixed), `discount_value`, `max_uses`, `current_uses`, `is_active`, `start_date`, `end_date`

**Backend:** Add:
- `discounts` table (as in Admin schema)
- Full CRUD: `GET`, `POST`, `GET/{id}`, `PUT/{id}`, `DELETE/{id}`

---

## 8. Dashboard Stats — **MISSING IN BACKEND**

Admin UI needs:
- `totalRevenue`, `totalOrders`, `totalCustomers`, `totalProducts`, `lowStockProducts`
- Sales chart data: `{ date, revenue, orders }[]`
- Recent orders
- Low stock products

**Backend:** Add:
- `GET /api/v1/admin/dashboard/stats` — aggregate stats
- `GET /api/v1/admin/dashboard/sales?days=30` — sales over time
- `GET /api/v1/admin/dashboard/recent-orders?limit=5`
- `GET /api/v1/admin/dashboard/low-stock?limit=5`

---

## Recommended Implementation Order

1. **Categories** — Required for products
2. **Inventory** — Required for stock management
3. **Admin Orders API** — List all orders, filters
4. **Customers** — Map from users or add table
5. **Discounts** — Promo codes
6. **Dashboard endpoints** — Stats and charts
7. **Products** — Add SKU, category_id, align with Admin
8. **Auth** — Admin login if using backend for Admin

---

## API Base URL Configuration

When connecting Admin UI to the backend, set:

```
NEXT_PUBLIC_API_URL=http://localhost:9090
```

Then create Next.js API route proxies (or use the backend directly with CORS) that forward requests from `/api/*` to `http://localhost:9090/api/v1/*` with the JWT token.

---

## How to Add New API Endpoints (Step-by-Step)

### Backend Structure (Spring Boot + MyBatis)

```
src/main/java/org/example/basiclogin/
├── controller/     ← Add new controllers here
├── service/        ← Add interfaces
├── service/impl/   ← Add implementations
├── repository/     ← Add MyBatis mappers
├── model/
│   ├── Entity/     ← Database entities
│   ├── Request/    ← Request DTOs
│   ├── Response/   ← Response DTOs
│   └── Enum/       ← Enums
```

### 1. Categories API (NEW)

**Database:** Add `categories` table (see Admin `init-db.sql`).

**Files to create:**
- `model/Entity/Category.java` — id, name, description, isActive
- `model/Request/CategoryRequest.java` — name, description
- `model/Response/CategoryResponse.java` — id, name, description
- `repository/CategoryRepository.java` — MyBatis interface
- `mapper/CategoryMapper.xml` — SQL
- `service/CategoryService.java` + `impl/CategoryServiceImpl.java`
- `controller/CategoryController.java`

**Endpoints:**
```java
@GetMapping("/api/v1/categories")           // List all
@PostMapping("/api/v1/categories")          // Create
@GetMapping("/api/v1/categories/{id}")      // Get one
@PutMapping("/api/v1/categories/{id}")      // Update
@DeleteMapping("/api/v1/categories/{id}")   // Delete (soft: is_active=false)
```

---

### 2. Admin Orders API (EXTEND EXISTING)

**Current:** `GET /api/v1/orders` returns all orders (no pagination, no filter).

**Add to OrderController:**
```java
@GetMapping("/admin")
public ResponseEntity<ApiResponse<PaginatedResponse<OrderResponse>>> getAllForAdmin(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "10") int limit,
    @RequestParam(required = false) String status  // pending, shipped, delivered, etc.
) {
    return responseEntity(..., orderService.getAllForAdmin(page, limit, status));
}
```

**Add to OrderStatus enum:** `PROCESSING`, `CANCELLED`

**OrderRepository:** Add `findAllPaginated(page, limit, status)` and `countAll(status)`.

**Response shape for Admin:** Include `order_number` (e.g. "ORD-2025-001"), `first_name`, `last_name`, `email` from user.

---

### 3. Customers API (MAP FROM USERS)

**Option A – Use existing users as customers:**

Create `UserController` (or `CustomerController`):
```java
@GetMapping("/api/v1/users")  // Admin only
public ResponseEntity<ApiResponse<PaginatedResponse<CustomerResponse>>> getAll(
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "10") int limit,
    @RequestParam(required = false) String search
) { ... }
```

**CustomerResponse:** id, email, fullName (split to first_name/last_name for Admin), totalOrders, totalSpent (from orders aggregate).

**Option B – Add `customers` table:** Same as Admin schema, with migration.

---

### 4. Inventory API (NEW)

**Database:** Add `inventory` table:
```sql
CREATE TABLE inventory (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT UNIQUE REFERENCES products(id),
  quantity_on_hand INT DEFAULT 0,
  quantity_reserved INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 10
);
```

**Files:** Entity, Repository, Service, Controller.

**Endpoints:**
```java
@GetMapping("/api/v1/inventory")                    // List with page, limit, lowStockOnly
@PutMapping("/api/v1/inventory/products/{productId}")  // Update stock
```

---

### 5. Discounts API (NEW)

**Database:** Add `discounts` table (code, description, discount_type, discount_value, max_uses, current_uses, is_active, start_date, end_date).

**Endpoints:** Full CRUD like Categories.

---

### 6. Dashboard API (NEW)

**Create AdminController:**
```java
@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    @GetMapping("/stats")
    // Returns: totalRevenue, totalOrders, totalCustomers, totalProducts, lowStockProducts

    @GetMapping("/sales")
    // Query: days=30. Returns: [{ date, revenue, orders }]

    @GetMapping("/recent-orders")
    // Query: limit=5. Returns: recent orders list

    @GetMapping("/low-stock")
    // Query: limit=5. Returns: products below threshold
}
```

---

## Quick Reference: What Exists vs What to Add

| Endpoint | Exists? | Action |
|----------|---------|--------|
| `GET /api/v1/orders` | ✅ Yes (all orders) | Add pagination + status filter |
| `PATCH /api/v1/orders/{id}/status` | ✅ Yes | Add PROCESSING, CANCELLED |
| `GET /api/v1/products` | ✅ Yes | Add `page`, `limit`, `search` for Admin |
| `GET /api/v1/categories` | ❌ No | **Create** |
| `GET /api/v1/users` (as customers) | ❌ No | **Create** |
| `GET /api/v1/inventory` | ❌ No | **Create** |
| `GET /api/v1/discounts` | ❌ No | **Create** |
| `GET /api/v1/admin/dashboard/*` | ❌ No | **Create** |
