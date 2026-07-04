# Natours-TS

Natours‑TS is a **full‑stack adventure booking application** built with Node.js, Express, MongoDB, TypeScript, Stripe and friends 🥱\*\*.  
It provides a secure, scalable backend API for managing tours, users, reviews, and bookings, while also serving dynamic views.  
This project is a TypeScript‑typed conversion of the original Natours app by [Jonas Schmedtmann](https://codingheroes.io), adapted to modern best practices with strict typing, improved maintainability, and production‑ready patterns.

---

## 🚀 Features

- **TypeScript** for type safety and maintainability
- **Express.js REST API** with modular routing
- **MongoDB Atlas + Mongoose** for data modeling
- **Authentication & Authorization** with JWT
- **Security middleware**: Helmet, Rate Limiting, XSS protection, HPP, Mongo Sanitize
- **Error handling** with centralized controller
- **Environment‑based configuration**
- **Compression & CORS** for performance and cross‑origin support
- **Frontend signup flow**: users can register directly from the UI
- **Review system**: only users who have booked a tour and attended at least one start date before `new Date()` can leave reviews
- **Polished UI**: improved design and user experience compared to the original Natours project

---

## 🔧 Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/NwankwoMichael/Natours-TS.git
   cd Natours-TS
   ```

---

2. Install dependencies:
   ```bash
    npm install
   ```

---

3. Configure environment variables in config.env:

   ```bash
    NODE_ENV=development
    DATABASE=<your-mongodb-uri>
    STRIPE_SECRET_KEY=<your-stripe-secret-key>
    STRIPE_PUBLIC_KEY=<your-stripe-public-key>
    STRIPE_WEBHOOK_SECRET=<your-stripe-webhook-secret>
    JWT_SECRET=<your-jwt-secret>
    JWT_EXPIRES_IN=90d
    JWT_COOKIE_EXPIRES_IN=90

   ```

---

4. Run the server:

   ```bash
    npm run dev

   ```

---

🌐 Live Demo

```bash
    👉 [Natours-TS on Render](https://natours-js.onrender.com)
```

---

📖 API Documentation

```bash
    👉 [Natours-TS API DOC](API_DOC=https://documenter.getpostman.com/view/54238187/2sBXqNmJEt)
```

---

🛠 Tech Stack

- **Backend:** Node.js, Express.js, TypeScript

- **Database:** MongoDB Atlas, Mongoose

- **Security:** Helmet, express-rate-limit, express-mongo-sanitize, xss-clean, hpp

- **Utilities:** Morgan, Cookie-Parser, Compression, CORS

- **Frontend:** Polished UI with signup and booking integration

- **Deployment:** Render (live demo), Heroku (compatible)

---

## 📂 Project Structure

Natours-TS/
├── controllers/ # Route controllers (tours, users, bookings)
├── models/ # Mongoose models
├── routes/ # Express routes
├── utils/ # Utility functions (error handling, etc.)
├── views/ # Pug templates
├── public/ # Static assets (CSS, JS, images)
├── server.js # App entry point
└── config.env # Environment variables

---

🙏 Credits

This project is based on the original Natours application by Jonas Schmedtmann.
Natours‑TS is a TypeScript‑typed adaptation, rebuilt for stronger type safety, modern development practices, and additional features.

---

🤝 Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

📌 Notes

Ensure trust proxy is set in app.js for secure cookies behind proxies:

```Ts
app.set('trust proxy', 1);
```

Webhooks require a public HTTPS endpoint. Use tools like ngrok or Stripe CLI for local testing.

Always verify webhook signatures with stripe.webhooks.constructEvent.

---

📜 License

This project is licensed under the MIT License.
