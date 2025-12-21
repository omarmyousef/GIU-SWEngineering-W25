# GIU Food-Truck System — Study Guide (Lecture in a Nutshell)

This document explains the whole project for non-programmers and new teammates. Read it like a short, friendly book: first what the tools are, then how our system uses them, then exactly what you can do and how to try it.


## 1) What this project is
- **Goal**: A simple food‑truck ordering system.
- **Users and roles**:
  - **Customer**: Browses trucks, views menus, builds a cart, places orders, checks order status.
  - **Truck Owner (Vendor)**: Manages their truck, menu items, and order statuses.
  - **Admin**: Mentioned for dashboards, but admin features are not implemented here.
- **Style**: A classic web app. Pages are rendered on the server and sent to the browser. Data is stored in a PostgreSQL database.


## 2) Technologies (plain English)
- **Node.js**: Lets JavaScript run on the server (not only in the browser).
- **Express**: A small web framework for Node to define URLs (endpoints) and what they do.
- **PostgreSQL (Postgres)**: The database where we store users, trucks, menus, carts, orders.
- **Knex**: A helper to write database queries in JavaScript instead of raw SQL.
- **hjs (Hogan templates)**: Server-side HTML templates used to render pages like login, dashboards, etc.
- **dotenv**: Reads secrets/config from a .env file (like database password, server port).
- **uuid**: Generates unique IDs (used here to create session tokens when users log in).
- **axios**: A web request library; currently included but not central to core flows.

Where you can see them:
- `server.js` sets up Express, templates, static files, endpoints.
- `connectors/db.js` configures Knex + Postgres using `.env` for the password.
- `routes/public/*.js` exposes public pages and public API endpoints (no login needed).
- `routes/private/*.js` exposes private pages and APIs (login required via a cookie session).
- `middleware/auth.js` blocks access to private routes if you’re not logged in.
- `utils/session.js` reads the login cookie and fetches the current user from the DB.


## 3) How the system is organized (architecture)
- **Server (backend)**: Express app listening on a port. It defines URLs. Some return HTML pages, others return JSON (data).
- **Views (frontend pages)**: HTML templates rendered by the server using hjs. No complex frontend framework here (no React/Vue). Just server-rendered pages + browser making HTTP requests.
- **Database**: Tables under the `FoodTruck.` schema store everything. Knex is used to run queries.
- **Sessions (login)**: When you log in, the server creates a row in `FoodTruck.Sessions` and gives the browser a `session_token` cookie. Private pages/APIs check that cookie.


## 4) Running the project locally (quick start)
Prerequisites:
- Install **Node.js** (LTS), **npm** (comes with Node), and **PostgreSQL**.

Steps:
1) Clone the repo and open it in your IDE.
2) In Postgres, create a database named `giu-swenginnering-project` (exact spelling as in `connectors/db.js`).
3) Create the `FoodTruck` schema and tables (see the “Database model” section below for the list). If you don’t have migrations, create tables manually to match the fields used by queries.
4) Create a `.env` file in the project root with:
   - `PASSWORD=YOUR_POSTGRES_PASSWORD`
   - Optionally `PORT=3001`
5) Install dependencies: `npm install`
6) Start the server: `npm run server`
7) Open your browser: `http://localhost:3001/`

If you see a home/login/register page, the server is running.


## 5) Database model (what tables exist and what they hold)
We infer the structure from the queries in the code. Schema names are prefixed with `FoodTruck.` below.
- **Users** (`FoodTruck.Users`)
  - Key fields: `userId`, `name`, `email`, `password`, `role` (`customer` or `truckOwner`), `birthDate`, `createdAt`.
- **Sessions** (`FoodTruck.Sessions`)
  - Key fields: `userId`, `token`, `expiresAt`.
  - Purpose: hold active logins. If a token is present and not expired, the user is “logged in”.
- **Trucks** (`FoodTruck.Trucks`)
  - Key fields: `truckId`, `truckName`, `ownerId` (points to a `Users.userId`), `truckStatus` (`available`), `orderStatus` (`available`), `createdAt`.
- **MenuItems** (`FoodTruck.MenuItems`)
  - Key fields: `itemId`, `truckId`, `name`, `price`, `description`, `category`, `status` (`available` or `unavailable`).
- **Carts** (`FoodTruck.Carts`)
  - Key fields: `cartId`, `userId`, `itemId`, `quantity`, `price`.
  - Rule: A cart may only contain items from a single truck at a time.
- **Orders** (`FoodTruck.Orders`)
  - Key fields: `orderId`, `userId`, `truckId`, `orderStatus` (`pending`, `preparing`, `ready`, `completed`, `cancelled`), `totalPrice`, `scheduledPickupTime`, `estimatedEarliestPickup`, `createdAt`.
- **OrderItems** (`FoodTruck.OrderItems`)
  - Key fields: `orderId`, `itemId`, `quantity`, `price`.

Note: Some legacy/tutorial pages refer to `backendTutorial.Employee` — that’s not part of the food‑truck flows and can be ignored.


## 6) Authentication and sessions (how login works)
- **Login**: You send `email` and `password` to `/api/v1/user/login`.
- The server checks the `Users` table. If ok, it creates a unique `token`, stores it with your `userId` and an expiration in `FoodTruck.Sessions`, then sets a browser cookie `session_token`.
- **Private routes**: A middleware (`middleware/auth.js`) runs before private pages/APIs. It reads the cookie, looks up the session in the DB, checks expiry, and if invalid it redirects to `/login`.
- **Logout**: `/api/v1/user/logout` deletes your session row and clears the cookie.

Security note: For learning simplicity, passwords are stored/compared as plain text in this template. In real apps, always hash with bcrypt/argon2, use HTTPS, and a proper cookie parser.


## 7) Backend — server and routing
Entrypoint: `server.js`
- Sets view engine to `hjs` and serves static files from `./public`.
- Registers public pages + public APIs.
- Applies `authMiddleware` to protect everything that follows.
- Registers private pages + private APIs.

File map:
- Public pages: `routes/public/view.js`
- Public APIs: `routes/public/api.js`
- Private pages: `routes/private/view.js`
- Private APIs: `routes/private/api.js`

### 7.1 Public pages (no login)
- **GET /** → render `home`
- **GET /login** → render `login`
- **GET /register** → render `register`

### 7.2 Public APIs (no login)
- **POST /api/v1/user** → Register a user; if role is `truckOwner`, also auto‑create a Truck.
- **POST /api/v1/user/login** → Log in, set `session_token` cookie, returns user info.
- **POST /api/v1/user/logout** → Log out, clear cookie.
- **GET /api/v1/user/profile?userId=...** → Public profile info for a given userId.
- **GET /api/v1/health** → Health check (verifies DB connectivity).
- **GET /api/v1/trucks/public** → List available trucks (no login).
- **GET /api/v1/menuItem/truck/:truckId/public** → Public menu for a given truck.

### 7.3 Private pages (login required)
- **GET /dashboard** → Redirects you to a role‑specific dashboard.
- **GET /vendor/dashboard** → Vendor dashboard (only `truckOwner`).
- **GET /customer/dashboard** → Customer dashboard (only `customer`).
- Aliases: **GET /user/dashboard** → Redirects to your role dashboard.
- Customer pages: **/cart**, **/myOrders**, **/trucks**, **/trucks/:truckId/menu**.
- Vendor pages: **/vendor/orders**, **/vendor/menu**, **/vendor/truck**.
- Misc/tutorial pages: **/home**, **/employee**, **/addEmployee**, **/search**, **/profile**.

### 7.4 Private APIs (login required)
For Truck Owners:
- **POST /api/v1/menuItem/new** → Create menu item.
- **GET /api/v1/menuItem/view** → List my truck’s menu items.
- **GET /api/v1/menuItem/view/:itemId** → Get a specific menu item (mine).
- **PUT /api/v1/menuItem/edit/:itemId** → Edit my menu item.
- **DELETE /api/v1/menuItem/delete/:itemId** → Soft‑delete (mark unavailable) my menu item.
- **GET /api/v1/trucks/myTruck** → View my truck info.
- **PUT /api/v1/trucks/updateOrderStatus** → Toggle taking orders (`available`/`unavailable`).
- **GET /api/v1/order/truckOrders** → View orders placed on my truck.
- **PUT /api/v1/order/updateStatus/:orderId** → Update an order’s status; can add earliest pickup estimate.
- **GET /api/v1/order/truckOwner/:orderId** → View details of a specific order (items included).

For Customers:
- **GET /api/v1/trucks/view** → List available trucks (same as public but requires login as customer).
- **GET /api/v1/menuItem/truck/:truckId** → View a truck’s menu.
- **GET /api/v1/menuItem/truck/:truckId/category/:category** → Filter menu items by category.
- **POST /api/v1/cart/new** → Add item to cart (enforces single‑truck cart rule).
- **GET /api/v1/cart/view** → View my cart.
- **PUT /api/v1/cart/edit/:cartId** → Change quantity in my cart.
- **DELETE /api/v1/cart/delete/:cartId** → Remove item from my cart.
- **POST /api/v1/order/new** → Place an order from my cart (transaction creates order + order items and clears cart).
- **GET /api/v1/order/myOrders** → List my orders.
- **GET /api/v1/order/details/:orderId** → Detailed view of one of my orders (items included).


## 8) Frontend — how pages work
- Pages live in the `views/` folder (hjs templates) and are rendered on the server with data placeholders.
- Navigation is classic links + forms. Private pages require you to be logged in (valid cookie).
- Typical pages:
  - **Login/Register**: create an account; if vendor, a Truck is created automatically.
  - **Customer Dashboard**: entry point for customers.
  - **Browse Trucks** and **Truck Menu**: explore and add items to cart.
  - **Cart**: review items and quantities.
  - **My Orders**: track order statuses.
  - **Vendor Dashboard/Menu/Orders**: manage menu and respond to orders.


## 9) Typical user flows (end‑to‑end)
- **Customer**
  - Register → Login → View trucks → Open a truck → Add menu items to cart → View cart → Place order → Track order status in “My Orders”.
- **Truck Owner**
  - Register with role `truckOwner` → Login → Land on Vendor Dashboard → Create menu items → Receive orders → Update order statuses (preparing/ready/completed).


## 10) Trying endpoints quickly (examples)
Use a REST client (Postman/Insomnia) or curl.
- Register a user:
  - POST `http://localhost:3001/api/v1/user`
  - Body JSON: `{ "name":"Alice", "email":"a@b.com", "password":"pw", "role":"customer" }`
- Login:
  - POST `http://localhost:3001/api/v1/user/login`
  - Body JSON: `{ "email":"a@b.com", "password":"pw" }`
  - On success, note the `session_token` cookie. Your client must preserve cookies for private endpoints.
- Public trucks (no login):
  - GET `http://localhost:3001/api/v1/trucks/public`
- Customer trucks (login as customer first):
  - GET `http://localhost:3001/api/v1/trucks/view`
- Vendor create menu item (login as truckOwner first):
  - POST `http://localhost:3001/api/v1/menuItem/new` with `{ "name":"Burger", "price":10, "category":"main" }`


## 11) Errors and responses
- **Success**: Usually HTTP 200/201 with JSON like `{ message: "..." }` or data arrays/objects.
- **Client errors** (your input is missing/wrong): 400 Bad Request.
- **Auth errors**: 301 redirect to `/login` for pages, 403 Forbidden for role violations, 404 Not Found for missing records.
- **Server errors**: 500 Internal Server Error with `{ error: "..." }`.


## 12) Notes, limitations, and safety
- Passwords are plain text in this template. In real apps, hash passwords and use HTTPS.
- Cookies are parsed manually. In real apps, use `cookie-parser` and set `Secure`/`SameSite` appropriately in production.
- There are no migrations here; you must ensure tables/columns exist as used by the queries.
- Admin role is referenced but not implemented with real features.


## 13) Quick reference (cheat sheet)
- **Public pages**: `/`, `/login`, `/register`
- **Private pages**: `/dashboard`, `/vendor/dashboard`, `/customer/dashboard`, `/cart`, `/myOrders`, `/trucks`, `/trucks/:truckId/menu`
- **Public APIs**:
  - POST `/api/v1/user`
  - POST `/api/v1/user/login`
  - POST `/api/v1/user/logout`
  - GET `/api/v1/user/profile?userId=...`
  - GET `/api/v1/health`
  - GET `/api/v1/trucks/public`
  - GET `/api/v1/menuItem/truck/:truckId/public`
- **Private APIs (Truck Owner)**:
  - POST `/api/v1/menuItem/new`
  - GET `/api/v1/menuItem/view`
  - GET `/api/v1/menuItem/view/:itemId`
  - PUT `/api/v1/menuItem/edit/:itemId`
  - DELETE `/api/v1/menuItem/delete/:itemId`
  - GET `/api/v1/trucks/myTruck`
  - PUT `/api/v1/trucks/updateOrderStatus`
  - GET `/api/v1/order/truckOrders`
  - PUT `/api/v1/order/updateStatus/:orderId`
  - GET `/api/v1/order/truckOwner/:orderId`
- **Private APIs (Customer)**:
  - GET `/api/v1/trucks/view`
  - GET `/api/v1/menuItem/truck/:truckId`
  - GET `/api/v1/menuItem/truck/:truckId/category/:category`
  - POST `/api/v1/cart/new`
  - GET `/api/v1/cart/view`
  - PUT `/api/v1/cart/edit/:cartId`
  - DELETE `/api/v1/cart/delete/:cartId`
  - POST `/api/v1/order/new`
  - GET `/api/v1/order/myOrders`
  - GET `/api/v1/order/details/:orderId`


## 14) Where to look in the code
- `server.js` — app setup and route wiring.
- `routes/public/api.js` — registration, login/logout, public listings.
- `routes/private/api.js` — vendor/customer features.
- `routes/public/view.js` and `routes/private/view.js` — which pages render.
- `middleware/auth.js` — access control for private routes.
- `utils/session.js` — how we read the cookie and fetch the current user.
- `connectors/db.js` — database connection config.


That’s all you need for the quiz and onboarding. Skim sections 2, 6, 7, and 13 before the quiz; use section 10 to try things quickly.
