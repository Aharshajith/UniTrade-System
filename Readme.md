# UniTrade System

A university marketplace for students to buy and sell used items (books, electronics, dorm gear, and more). Built with **Node.js**, **Express**, **MongoDB**, and a **responsive web frontend**.

---

## Features

- Browse, search, and filter listings by category
- User sign up / log in and manage your own items
- Item popup with seller contact (name, email, phone, university, faculty)
- Welcome screen → auto-redirect to marketplace
- Admin dashboard to view and delete users and items

---

## Tech stack

Node.js · Express · MongoDB · Mongoose · HTML · CSS · JavaScript

---

## Quick start

**Requirements:** Node.js, MongoDB running locally

```bash
npm install
npm start
```

- **Marketplace:** http://localhost:5000  
- **Admin:** http://localhost:5000/admin.html  

Database: `mongodb://127.0.0.1:27017/unitrade` (see `config/db.js`)

---

## API (base: `/api`)

| Users | Items | Admin |
|-------|-------|-------|
| `POST /users/register` | `GET /items` | `POST /admin/login` |
| `POST /users/login` | `POST /items` *(auth)* | `GET /admin/users` *(auth)* |
| | `PUT /items/:id` *(auth)* | `GET /admin/items` *(auth)* |
| | `DELETE /items/:id` *(auth)* | `DELETE /admin/users/:id` *(auth)* |

**User auth headers:** `x-user-email`, `x-user-password`  
**Admin auth headers:** `x-admin-email`, `x-admin-password`

---

## Project layout

```
config/  controllers/  middleware/  models/  routes/  public/  index.js
```

---

## Note

Passwords are stored in plain text in this version—not for production without hashing and proper authentication.

**License:** ISC
