# GIU Food Truck Management System

A web application for browsing food trucks, managing menus and orders, and placing pickup orders. Built for Software Engineering coursework.

## Team Members
- **Omar Mohammed Youssef** — 17006288 — T17
- **Mohammed Haitham Awad** — 17003920 — T17
- **Adham Sherif** — 17001397 — T14
- **Ahmed Ibrahim** — 13007292 — T5
- **Sobhy Wael** — 17001974 — T15
- **Mahmoud Ehab** — 17003955 — T17

## Features

### Customer
- View available trucks
- Browse a truck menu and filter by category
- Add items to cart, update quantity, remove items
- Place an order for a scheduled pickup time
- View my orders and view order details

### Truck Owner
- View my truck information and toggle order availability
- Create, view, edit, and delete (soft delete) menu items
- View incoming orders for my truck
- Update order status and earliest pickup estimate
- View order details including items and quantities

## Technology Stack
- **Frontend**: Server-rendered views using `hjs`, static assets under `public/`
- **Backend**: Node.js, Express, `dotenv`, `axios`, `uuid`
- **Database**: PostgreSQL with `knex` query builder and `pg` driver
- **Dev Tools**: `nodemon`

Key files:
- `server.js`: Express app, routes, middleware and view engine setup
- `routes/public/*.js`, `routes/private/*.js`: API and view routes (public vs auth-protected)
- `connectors/db.js`: Knex PostgreSQL connector (reads DB password from `.env`)
- `connectors/scripts.sql`: Database schema (DDL)
- `connectors/seed.sql`: Optional sample data

## ERD and Suggested Tables

Tables implemented in `connectors/scripts.sql` under schema `FoodTruck`:

- **Users**(`userId` PK, `name`, `email` UNIQUE, `password`, `role` ['customer'|'truckOwner'], `birthDate`, `createdAt`)
- **Trucks**(`truckId` PK, `truckName` UNIQUE, `truckLogo`, `ownerId` FK→Users.userId, `truckStatus`, `orderStatus`, `createdAt`)
- **MenuItems**(`itemId` PK, `truckId` FK→Trucks.truckId, `name`, `description`, `price`, `category`, `status`, `createdAt`)
- **Orders**(`orderId` PK, `userId` FK→Users.userId, `truckId` FK→Trucks.truckId, `orderStatus`, `totalPrice`, `scheduledPickupTime`, `estimatedEarliestPickup`, `createdAt`)
- **OrderItems**(`orderItemId` PK, `orderId` FK→Orders.orderId, `itemId` FK→MenuItems.itemId, `quantity`, `price`)
- **Carts**(`cartId` PK, `userId` FK→Users.userId, `itemId` FK→MenuItems.itemId, `quantity`, `price`)
- **Sessions**(`id` PK, `userId` FK→Users.userId, `token`, `expiresAt`)

Relationship summary:
- Users 1—N Trucks
- Trucks 1—N MenuItems
- Users 1—N Orders; Trucks 1—N Orders
- Orders 1—N OrderItems; MenuItems 1—N OrderItems
- Users 1—N Carts; MenuItems 1—N Carts
- Users 1—N Sessions

ERD sketch:
```
Users (userId) ──< Trucks (truckId)
   │                 │
   │                 └──< MenuItems (itemId)
   └──< Orders (orderId) >──┐
                             └──< OrderItems (orderItemId) >── MenuItems
Users ──< Carts >── MenuItems
Users ──< Sessions
```

## Installation and Setup

1. **Prerequisites**
   - Node.js 18+
   - PostgreSQL 13+ (local instance)
   - pgAdmin or psql

2. **Clone and install**
   - Run `npm install`

3. **Database**
   - Create a database named `giu-swenginnering-project`
   - Execute `connectors/scripts.sql` to create schema and tables
   - (Optional) Execute `connectors/seed.sql` for sample data

4. **Environment variables**
   - Create a `.env` file in project root:
     ```
     PASSWORD=<your_postgres_password>
     PORT=3001
     NODE_ENV=development
     ```
   - DB connection defaults (change in `connectors/db.js` if needed): host `localhost`, port `5432`, user `postgres`

5. **Run the server**
   - `npm run server`
   - Open http://localhost:3001/

## Test Credentials

You can register test users using the UI (`/register`) or API:
- POST ` /api/v1/user ` with JSON body:
  ```json
  {"name":"Test Customer","email":"customer@test.com","password":"pass123","role":"customer"}
  ```
- POST ` /api/v1/user ` for a truck owner:
  ```json
  {"name":"Test Vendor","email":"vendor@test.com","password":"pass123","role":"truckOwner"}
  ```
- Login: POST ` /api/v1/user/login ` with `{ "email": "...", "password": "..." }`

Notes:
- Seeded users in `seed.sql` have hashed passwords, while the current login implementation compares plaintext passwords. Therefore, seeded accounts will not log in unless you align hashing in both places. Use the registration endpoints above for testing.

## Screenshots
Place screenshots under `docs/screenshots/` and update links below.
- Login page: `docs/screenshots/login.png`
- Register page: `docs/screenshots/register.png`
- Customer dashboard: `docs/screenshots/customer-dashboard.png`
- Trucks list: `docs/screenshots/trucks.png`
- Truck menu: `docs/screenshots/truck-menu.png`
- Cart: `docs/screenshots/cart.png`
- My Orders: `docs/screenshots/my-orders.png`
- Vendor dashboard: `docs/screenshots/vendor-dashboard.png`
- Vendor menu management: `docs/screenshots/vendor-menu.png`
- Vendor orders: `docs/screenshots/vendor-orders.png`

## API Endpoints Summary

### Public
| Method | Endpoint                                   | Description                                      |
|-------|---------------------------------------------|--------------------------------------------------|
| POST  | /api/v1/user                                | Register user (customer or truckOwner)           |
| POST  | /api/v1/user/login                          | Login, sets `session_token` cookie               |
| POST  | /api/v1/user/logout                         | Logout, clears session                           |
| GET   | /api/v1/user/profile?userId=                | Public user profile                              |
| GET   | /api/v1/health                              | Health check                                     |
| GET   | /api/v1/trucks/public                       | List available trucks (public)                   |
| GET   | /api/v1/menuItem/truck/:truckId/public      | List available menu items for a truck (public)   |

### Private (requires valid `session_token` cookie)

Truck Owner
| Method | Endpoint                              | Description |
|-------|----------------------------------------|-------------|
| POST  | /api/v1/menuItem/new                   | Create menu item |
| GET   | /api/v1/menuItem/view                  | View my menu items |
| GET   | /api/v1/menuItem/view/:itemId          | View one menu item |
| PUT   | /api/v1/menuItem/edit/:itemId          | Edit menu item |
| DELETE| /api/v1/menuItem/delete/:itemId        | Soft delete menu item |
| GET   | /api/v1/trucks/myTruck                 | View my truck info |
| PUT   | /api/v1/trucks/updateOrderStatus       | Update truck order availability |
| GET   | /api/v1/order/truckOrders              | List orders for my truck |
| PUT   | /api/v1/order/updateStatus/:orderId    | Update order status / ETA |
| GET   | /api/v1/order/truckOwner/:orderId      | View order details (owner) |

Customer
| Method | Endpoint                                      | Description |
|-------|------------------------------------------------|-------------|
| GET   | /api/v1/trucks/view                            | List available trucks |
| GET   | /api/v1/menuItem/truck/:truckId                | List truck menu |
| GET   | /api/v1/menuItem/truck/:truckId/category/:category | Filter menu by category |
| POST  | /api/v1/cart/new                               | Add item to cart |
| GET   | /api/v1/cart/view                              | View cart |
| PUT   | /api/v1/cart/edit/:cartId                      | Update cart item quantity |
| DELETE| /api/v1/cart/delete/:cartId                    | Remove cart item |
| POST  | /api/v1/order/new                              | Place order |
| GET   | /api/v1/order/myOrders                         | View my orders |
| GET   | /api/v1/order/details/:orderId                 | View order details (customer) |

## Contributors
- **Omar Mohammed Youssef**
- **Mohammed Haitham Awad**
- **Adham Sherif**
- **Ahmed Ibrahim**
- **Sobhy Wael**
- **Mahmoud Ehab**
