const express = require('express');
const expenseRouter = express.Router();
const authMiddleware = require('../middleware/auth');
const { addExpense, getAllExpenses, updateExpense, downloadExpenseExcel, deleteExpense, getExpensesOverview } = require('../controllers/expenseController');

expenseRouter.post('/add', authMiddleware, addExpense);
expenseRouter.get('/get', authMiddleware, getAllExpenses);
expenseRouter.put('/update/:id', authMiddleware, updateExpense);
expenseRouter.get('/download-excel', authMiddleware, downloadExpenseExcel);
expenseRouter.delete('/delete/:id', authMiddleware, deleteExpense);
expenseRouter.get('/overview', authMiddleware, getExpensesOverview);

module.exports = expenseRouter;
