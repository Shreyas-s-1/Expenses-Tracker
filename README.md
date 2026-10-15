# Pennywise

Pennywise is a simple personal finance tracker for keeping an eye on income, expenses, and savings. Add transactions, organize them by category, and see where your money is going with the dashboard and its daily, weekly, and monthly reports.

## What you can do

- Create an account and securely sign in.
- Add, edit, and delete income or expense transactions.
- View your balance, income, expenses, and spending by category.
- Search and export transactions as a CSV file.

## Run it locally

You’ll need Node.js and a MongoDB connection.

1. Configure the backend environment. Copy `tracker-backend/.env.example` to `tracker-backend/.env`, then set `MONGODB_URI` to your MongoDB connection string and replace `SEC_KEY` with a long, private secret.
2. Start the backend:

   ```bash
   cd tracker-backend
   npm install
   npm start
   ```

3. In a second terminal, start the frontend:

   ```bash
   cd tracker_front
   npm install
   npm run dev
   ```

4. Open the local address Vite prints in the terminal and create an account.

The frontend’s development server forwards `/api` requests to the backend on port `2000` by default. If you use a different port, set `VITE_API_PROXY_TARGET` in `tracker_front/.env`. Never commit `.env` files or share your database credentials or signing secret.

## Built with

React, Vite, Tailwind CSS, Express, MongoDB, and Mongoose.
