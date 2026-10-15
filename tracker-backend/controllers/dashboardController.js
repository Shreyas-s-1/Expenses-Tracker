const incomeDB = require("../models/incomeModel");
const expenseDB = require("../models/expenseModel");

async function getDashboardOverview(req, res) {
  const userId = req.user._id;
  const { range } = req.query;
  const now=new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

try {
    const incomes = await incomeDB.find({ userId, date: { $gte: startOfMonth } }).lean();
    const expenses = await expenseDB.find({ userId, date: { $gte: startOfMonth } }).lean();

     const monthlyIncome = incomes.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const monthlyExpense = expenses.reduce((acc, cur) => acc + Number(cur.amount || 0), 0);
    const savings = monthlyIncome - monthlyExpense;
    const savingsRate = monthlyIncome === 0 ? 0 : Math.round((savings / monthlyIncome) * 100);

    const recentTransactions = [
      ...incomes.map((i) => ({ ...i, type: "income" })),
      ...expenses.map((e) => ({ ...e, type: "expense" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const spendByCategory = {};
    for (const exp of expenses) {
      const cat = exp.category || "Other";
      spendByCategory[cat] = (spendByCategory[cat] || 0) + Number(exp.amount || 0);
    }

    const expenseDistribution = Object.entries(spendByCategory).map(([category, amount]) => ({
      category,
      amount,
      percent: monthlyExpense === 0 ? 0 : Math.round((amount / monthlyExpense) * 100),
    }));

    res.status(200).json({
      success: true,
      data: {
        monthlyIncome,
        monthlyExpense,
        savings,
        savingsRate,
        recentTransactions,
        expenseDistribution
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "An error occurred while fetching dashboard overview" });
}

}

module.exports = { getDashboardOverview };