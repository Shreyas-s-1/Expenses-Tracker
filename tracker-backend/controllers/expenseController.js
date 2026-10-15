const expenseDB = require ('../models/expenseModel');

const getDateRange = require('../utils/dataFilter');
const XLSX = require('xlsx');

async function addExpense(req, res) {
    try {
        const { description, amount, category, date } = req.body;
        const newExpense = new expenseDB({
            description,
            amount,
            category,
            date,
            userId: req.user._id
        });
        await newExpense.save();
        res.status(201).json({success: true, message: "Expense added successfully", expense: newExpense});
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


async function getAllExpenses(req, res) {
    try {
        const userId = req.user._id;
        const expenses = await expenseDB.find({ userId }).sort({ date: -1 });
        res.status(200).json({success: true, expenses});
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function updateExpense(req, res) {    
const { id: expenseId } = req.params;
const userId = req.user._id;
const { description, amount, category, date } = req.body;

try {
    const updatedExpense = await expenseDB.findOneAndUpdate(
        { _id: expenseId, userId },
        { description, amount, category, date },
        { new: true, runValidators: true }
    );
    if (!updatedExpense) {
        return res.status(404).json({ success: false, error: "Expense not found" });
    }
    res.status(200).json({ success: true, message: "Expense updated successfully", expense: updatedExpense });
} catch (error) {
    res.status(400).json({ success: false, error: error.message });
}
}

async function deleteExpense(req,res) {
   const userId = req.user._id;
   try {
    const expense = await expenseDB.findOneAndDelete({ _id: req.params.id, userId });
    if (!expense) {
        return res.status(404).json({ success: false, error: "Expense not found" });
    }
    return res.status(200).json({ success: true, message: "Expense deleted successfully" });
   } catch (error) {
    res.status(400).json({ success: false, error: error.message });
   }    
    
}


async function downloadExpenseExcel(req, res) {
  const userId = req.user._id;
    try {
        const expenses = await expenseDB.find({ userId }).sort({ date: -1 });
        const plainTextData = expenses.map((item) => ({
            description: item.description,
            amount: item.amount,
            category: item.category,
            date: item.date.toISOString().split('T')[0],
        }));
        const worksheet = XLSX.utils.json_to_sheet(plainTextData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'expenseModel');
        XLSX.writeFile(workbook, 'expense_details.xlsx');

        res.download('expense_details.xlsx');
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while downloading expense data" });
    }   
}


async function getExpensesOverview  (req, res) {
     try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);
        const expense = await expenseDB.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: -1 });
        
            const totalExpense = expense.reduce((acc, cur) => acc + cur.amount, 0);
    const averageExpense =
      expense.length > 0 ? totalExpense / expense.length : 0;
    const numberOfTransactions = expense.length;
const recentTransactions = expense.slice(0, 5); // Get the 5 most recent transactions
        return res.status(200).json({ success: true, data: { totalExpense, averageExpense, numberOfTransactions, recentTransactions } });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while fetching expense overview" }); 
    }
}

module.exports={
    addExpense,
    getExpensesOverview,
downloadExpenseExcel,
deleteExpense,
updateExpense,
getAllExpenses,
}