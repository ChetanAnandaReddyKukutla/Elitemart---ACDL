# 🛍️ EliteMart – Full-Stack eCommerce Platform

**EliteMart** is a full-stack eCommerce web application built using the **MERN stack**. It allows users to browse products, manage their cart, securely checkout using PayPal, and track their orders. Admin users can manage products, users, and orders through a dedicated dashboard.

---

## 🚀 Features

- 🛒 Product listing, search, and filtering
- 🔐 JWT-based User Authentication and Authorization
- 🧺 Cart management and secure order placement
- 💳 PayPal payment gateway integration
- 📦 Order history tracking
- 📊 Admin dashboard with CRUD operations for products, users, and orders
- 📱 Fully responsive UI for mobile and desktop
- 🧠 Scalable and modular backend architecture

---

## 🛠️ Tech Stack

**Frontend:**
- React.js
- Redux Toolkit (or Context API)
- Tailwind CSS
- React Router DOM
- Axios

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT)
- bcrypt.js
- PayPal REST API

---

## 📁 Folder Structure (Backend)
- config
- controllers
- data
- lib
- middlewares
- models
- routes
- seeder.js
- server.js


---

## 🧪 How to Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/NikhilNaik23/EliteMart.git
cd EliteMart
```

### 2. Backend Setup

```bash
npm install
npm run dev
```
- Make sure to configure your .env file in root:

```bash
PORT=5000
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret_key
ENV=development

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

CLIENT_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

- Configure your .env file in the frontend directory:
```bash
VITE_BACKEND_URL=http://localhost:5000
VITE_PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
```

