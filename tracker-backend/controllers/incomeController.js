const incomeDB = require('../models/incomeModel');
const XLSX = require('xlsx');
const getDateRange = require('../utils/dataFilter');

async function addIncome(req, res) {
    const userId = req.user._id;
    const { description, amount, category, date } = req.body;   
    if (!description || !amount || !category || !date) {
        return res.status(400).json({ success: false, error: "All fields are required" });
    }
    try {
        const income = await incomeDB.create({
            description,
            amount,
            category,
            date,
            userId
        });
        return res.status(201).json({ success: true, income });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while adding income" });
    }
}

async function getAllIncome(req, res) {
    const userId = req.user._id;
    try {
        const income = await incomeDB.find({ userId }).sort({ date: -1 });
        return res.status(200).json({ success: true, income });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while fetching income" });
    }   
}

async function updateIncome(req, res) {
    const userId = req.user._id; 
    const { id: incomeId } = req.params;
    const { description, amount, category, date } = req.body;
    try {
        const updatedIncome = await incomeDB.findOneAndUpdate(
            { _id: incomeId, userId },
            { description, amount, category, date },
            { new: true, runValidators: true }
        );
        if (!updatedIncome) {
            return res.status(404).json({ success: false, error: "Income not found" });
        }
        return res.status(200).json({ success: true, income: updatedIncome });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while updating income" });
    }
}

async function deleteIncome(req, res) {
    const userId = req.user._id;
    try {
        const income = await incomeDB.findOneAndDelete({ _id: req.params.id, userId });
        if (!income) {
            return res.status(404).json({ success: false, error: "Income not found" });
        }
        return res.status(200).json({ success: true, message: "Income deleted successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while deleting income" });
    }   
}

async function downloadIncomeExcel(req, res) { 
    const userId = req.user._id;
    try {
        const income = await incomeDB.find({ userId }).sort({ date: -1 });
        const plainTextData = income.map((item) => ({
            description: item.description,
            amount: item.amount,
            category: item.category,
            date: item.date.toISOString().split('T')[0],
        }));
        const worksheet = XLSX.utils.json_to_sheet(plainTextData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'incomeModel');
        XLSX.writeFile(workbook, 'income_details.xlsx');

        res.download('income_details.xlsx');
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while downloading income data" });
    }       
}

async function getIncomeOverview(req, res) {
    try {
        const userId = req.user._id;
        const { range = "monthly" } = req.query;
        const { start, end } = getDateRange(range);
        const incomes = await incomeDB.find({
            userId,
            date: { $gte: start, $lte: end }
        }).sort({ date: -1 });
        
        const totalIncome = incomes.reduce((acc, cur) => acc + cur.amount, 0);
        const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
        const numberOfTransactions = incomes.length;
        const recentTransactions = incomes.slice(0, 9);
        
        return res.status(200).json({ success: true, data: { totalIncome, averageIncome, numberOfTransactions, recentTransactions } });
    } catch (error) {
        return res.status(500).json({ success: false, error: "An error occurred while fetching income overview" }); 
    }
}

module.exports = {
    addIncome,
    getAllIncome,
    updateIncome,
    deleteIncome,
    downloadIncomeExcel,
    getIncomeOverview
};