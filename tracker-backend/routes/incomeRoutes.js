const express = require('express');
const incomeRouter = express.Router();
const { addIncome, getAllIncome, updateIncome, downloadIncomeExcel, deleteIncome, getIncomeOverview } = require('../controllers/incomeController');
const authenticateUser = require('../middleware/auth');


incomeRouter.post('/add', authenticateUser, addIncome);
incomeRouter.get('/get', authenticateUser, getAllIncome);
incomeRouter.put('/update/:id', authenticateUser, updateIncome);
incomeRouter.get('/download-excel', authenticateUser, downloadIncomeExcel);
incomeRouter.delete('/delete/:id', authenticateUser, deleteIncome);
incomeRouter.get('/overview', authenticateUser, getIncomeOverview);

module.exports = incomeRouter;