const STORAGE_KEY = 'pennywise.transactions.v1';
import { apiRequest, getApiToken } from './api';

const today = () => {
    const date = new Date();
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const sampleTransactions = () => {
    const now = new Date();
    const date = (offset) => {
        const value = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
    };
    return [
        { id: 'demo-1', type: 'income', description: 'Monthly salary', amount: 4200, category: 'Salary', date: date(0) },
        { id: 'demo-2', type: 'expense', description: 'Weekly groceries', amount: 86.4, category: 'Food & dining', date: date(0) },
        { id: 'demo-3', type: 'expense', description: 'Internet subscription', amount: 54.99, category: 'Bills & utilities', date: date(1) },
        { id: 'demo-4', type: 'income', description: 'Freelance project', amount: 680, category: 'Freelance', date: date(2) },
        { id: 'demo-5', type: 'expense', description: 'Dinner with friends', amount: 72.5, category: 'Food & dining', date: date(3) },
        { id: 'demo-6', type: 'expense', description: 'Metro pass', amount: 42, category: 'Transport', date: date(4) },
        { id: 'demo-7', type: 'income', description: 'Design consultation', amount: 250, category: 'Freelance', date: date(6) },
        { id: 'demo-8', type: 'expense', description: 'New running shoes', amount: 119, category: 'Shopping', date: date(8) },
        { id: 'demo-9', type: 'expense', description: 'Electricity bill', amount: 96, category: 'Bills & utilities', date: date(12) },
        { id: 'demo-10', type: 'income', description: 'Monthly salary', amount: 4200, category: 'Salary', date: date(21) },
        { id: 'demo-11', type: 'expense', description: 'Weekend getaway', amount: 315, category: 'Travel', date: date(26) },
    ];
};

const getStoredTransactions = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) {
        const examples = sampleTransactions();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(examples));
        return examples;
    }
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        throw new Error('Saved demo transactions could not be read. Clear this browser’s Pennywise data and try again.');
    }
};

const saveStoredTransactions = (transactions) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
};

const normalize = (item, type) => ({
    id: item._id || item.id,
    type,
    description: item.description,
    amount: Number(item.amount),
    category: item.category,
    date: new Date(item.date).toISOString().slice(0, 10),
});

export const loadTransactions = async () => {
    if (!getApiToken()) return getStoredTransactions();
    const [incomeResult, expenseResult] = await Promise.all([
        apiRequest('/income/get'),
        apiRequest('/expense/get'),
    ]);
    return [
        ...(incomeResult.income || []).map((item) => normalize(item, 'income')),
        ...(expenseResult.expenses || []).map((item) => normalize(item, 'expense')),
    ].sort((a, b) => b.date.localeCompare(a.date));
};

export const saveTransaction = async (transaction) => {
    const payload = { ...transaction, amount: Number(transaction.amount) };
    if (!getApiToken()) {
        const transactions = getStoredTransactions();
        const saved = { ...payload, id: transaction.id || `local-${crypto.randomUUID()}` };
        saveStoredTransactions(transaction.id
            ? transactions.map((item) => item.id === transaction.id ? saved : item)
            : [saved, ...transactions]);
        return saved;
    }
    const endpoint = `/${transaction.type}/${transaction.id ? `update/${transaction.id}` : 'add'}`;
    const result = await apiRequest(endpoint, {
        method: transaction.id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
    });
    return normalize(result.income || result.expense, transaction.type);
};

export const removeTransaction = async (transaction) => {
    if (!getApiToken()) {
        saveStoredTransactions(getStoredTransactions().filter((item) => item.id !== transaction.id));
        return;
    }
    await apiRequest(`/${transaction.type}/delete/${transaction.id}`, { method: 'DELETE' });
};

export const demoMode = () => !getApiToken();
export const getToday = today;
