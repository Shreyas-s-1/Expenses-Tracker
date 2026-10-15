import { useEffect, useMemo, useState } from 'react';
import {
    demoMode,
    getToday,
    loadTransactions,
    removeTransaction,
    saveTransaction,
} from '../services/transactionApi';

const CURRENCY = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const CATEGORY_COLORS = ['#14b8a6', '#818cf8', '#f59e0b', '#f472b6', '#38bdf8', '#a3e635'];
const EXPENSE_CATEGORIES = ['Food & dining', 'Bills & utilities', 'Transport', 'Shopping', 'Health', 'Travel', 'Education', 'Entertainment', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investments', 'Business', 'Gifts', 'Other'];

const Icon = ({ name, className = 'h-5 w-5' }) => {
    const paths = {
        plus: <><path d="M12 5v14M5 12h14" /></>,
        search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
        arrowUp: <><path d="M12 19V5m-7 7 7-7 7 7" /></>,
        arrowDown: <><path d="M12 5v14m-7-7 7 7 7-7" /></>,
        wallet: <><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v16H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 7h16M15 13h2" /></>,
        trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
        dots: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
        edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" /></>,
        trash: <><path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
        close: <><path d="m18 6-12 12M6 6l12 12" /></>,
        download: <><path d="M12 3v12m-5-5 5 5 5-5M5 20h14" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
        chevron: <><path d="m9 18 6-6-6-6" /></>,
    };
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

const formatCurrency = (amount) => CURRENCY.format(amount || 0);

const getRange = (period, date = new Date()) => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let end;
    if (period === 'daily') {
        end = new Date(start);
        end.setDate(start.getDate() + 1);
    } else if (period === 'weekly') {
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
        end = new Date(start);
        end.setDate(start.getDate() + 7);
    } else {
        start.setDate(1);
        end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    }
    return { start, end };
};

const inRange = (transaction, range) => {
    const date = new Date(`${transaction.date}T00:00:00`);
    return date >= range.start && date < range.end;
};

const getBuckets = (period, range, transactions) => {
    const count = period === 'daily' ? 1 : period === 'weekly' ? 7 : Math.ceil((range.end - range.start) / 86400000 / 7);
    const step = period === 'daily' ? range.end - range.start : period === 'weekly' ? 86400000 : 7 * 86400000;
    return Array.from({ length: count }, (_, index) => {
        const start = new Date(range.start.getTime() + index * step);
        const end = new Date(Math.min(start.getTime() + step, range.end.getTime()));
        const matching = transactions.filter((item) => {
            const date = new Date(`${item.date}T00:00:00`);
            return date >= start && date < end;
        });
        const label = period === 'daily'
            ? 'Today'
            : period === 'weekly'
                ? start.toLocaleDateString('en', { weekday: 'short' })
                : `W${index + 1}`;
        return {
            label,
            income: matching.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0),
            expense: matching.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0),
        };
    });
};

const getCategoryTotals = (transactions) => {
    const totals = new Map();
    transactions.filter((item) => item.type === 'expense').forEach((item) => {
        totals.set(item.category, (totals.get(item.category) || 0) + item.amount);
    });
    return [...totals.entries()]
        .map(([category, amount], index) => ({ category, amount, color: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }))
        .sort((a, b) => b.amount - a.amount);
};

const emptyForm = () => ({ type: 'expense', description: '', amount: '', category: EXPENSE_CATEGORIES[0], date: getToday() });

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [period, setPeriod] = useState('monthly');
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;
        loadTransactions()
            .then((items) => { if (active) setTransactions(items); })
            .catch((loadError) => { if (active) setError(loadError.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const range = useMemo(() => getRange(period), [period]);
    const periodTransactions = useMemo(() => transactions.filter((item) => inRange(item, range)), [transactions, range]);
    const income = periodTransactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const expenses = periodTransactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? Math.max(0, Math.round((balance / income) * 100)) : 0;
    const buckets = useMemo(() => getBuckets(period, range, periodTransactions), [period, range, periodTransactions]);
    const categories = useMemo(() => getCategoryTotals(periodTransactions), [periodTransactions]);
    const categoryTotal = categories.reduce((sum, item) => sum + item.amount, 0);
    let donutEnd = 0;
    const donut = categories.map((item) => {
        const segmentStart = donutEnd;
        donutEnd += categoryTotal ? item.amount / categoryTotal * 100 : 0;
        return `${item.color} ${segmentStart}% ${donutEnd}%`;
    }).join(', ');

    const visibleTransactions = periodTransactions
        .filter((item) => typeFilter === 'all' || item.type === typeFilter)
        .filter((item) => `${item.description} ${item.category}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date));

    const openNew = () => {
        setEditing(null);
        setForm(emptyForm());
        setModalOpen(true);
    };

    const openEdit = (transaction) => {
        setEditing(transaction);
        setForm({ ...transaction, amount: String(transaction.amount) });
        setModalOpen(true);
    };

    const handleTypeChange = (type) => setForm((current) => ({
        ...current,
        type,
        category: (type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0],
    }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSaving(true);
        try {
            const saved = await saveTransaction({ ...form, id: editing?.id });
            setTransactions((current) => editing
                ? current.map((item) => item.id === saved.id ? saved : item)
                : [saved, ...current]);
            setModalOpen(false);
        } catch (saveError) {
            setError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (transaction) => {
        if (!window.confirm(`Delete "${transaction.description}"? This cannot be undone.`)) return;
        setError('');
        try {
            await removeTransaction(transaction);
            setTransactions((current) => current.filter((item) => item.id !== transaction.id));
        } catch (deleteError) {
            setError(deleteError.message);
        }
    };

    const exportCsv = () => {
        const rows = [['Date', 'Type', 'Description', 'Category', 'Amount'], ...visibleTransactions.map((item) => [item.date, item.type, item.description, item.category, item.amount])];
        const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `pennywise-${period}-transactions.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const periodName = period === 'daily' ? 'Today' : period === 'weekly' ? 'This week' : 'This month';

    return (
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-8">
            <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                    <p className="mb-2 text-sm font-semibold text-teal-700">YOUR MONEY, IN FOCUS</p>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Your money, in focus.</h1>
                    <p className="mt-2 text-slate-500">Here’s how your finances are looking.</p>
                </div>
                <button onClick={openNew} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-600/15 transition hover:-translate-y-0.5 hover:bg-teal-700">
                    <Icon name="plus" className="h-4 w-4" /> Add transaction
                </button>
            </section>

            {error && (
                <div role="alert" className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <span>{error}</span>
                    <button onClick={() => setError('')} aria-label="Dismiss error"><Icon name="close" className="h-4 w-4" /></button>
                </div>
            )}

            {demoMode() && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm text-sky-800">
                    <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-sky-500" />
                    <p><strong>Demo workspace.</strong></p>
                </div>
            )}

            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Financial summary">
                <SummaryCard title="Total balance" amount={balance} icon="wallet" color="teal" subtitle="Income minus expenses" />
                <SummaryCard title="Income" amount={income} icon="arrowDown" color="green" subtitle={periodName} />
                <SummaryCard title="Expenses" amount={expenses} icon="arrowUp" color="orange" subtitle={periodName} />
                <SummaryCard title="Savings rate" amount={`${savingsRate}%`} icon="trend" color="violet" subtitle={income ? 'Of your income saved' : 'Add income to calculate'} />
            </section>

            <section className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,1fr)]">
                <article className="panel-card p-5 sm:p-6">
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Cash flow</h2>
                            <p className="mt-1 text-sm text-slate-500">Income and spending over time</p>
                        </div>
                        <PeriodSelector value={period} onChange={setPeriod} />
                    </div>
                    <div className="mb-4 flex gap-5 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-2"><i className="legend-dot bg-teal-500" /> Income</span>
                        <span className="flex items-center gap-2"><i className="legend-dot bg-orange-300" /> Expenses</span>
                    </div>
                    <div className="bar-chart" role="img" aria-label={`${periodName} income and expense chart`}>
                        {buckets.map((bucket) => {
                            const peak = Math.max(...buckets.flatMap((item) => [item.income, item.expense]), 1);
                            const incomeHeight = bucket.income ? Math.max(5, bucket.income / peak * 100) : 0;
                            const expenseHeight = bucket.expense ? Math.max(5, bucket.expense / peak * 100) : 0;
                            return (
                                <div className="bar-column" key={bucket.label}>
                                    <div className="bar-track">
                                        <div className="bar-pair">
                                            <span className="bar-income" style={{ height: `${incomeHeight}%` }} title={`Income ${formatCurrency(bucket.income)}`} />
                                            <span className="bar-expense" style={{ height: `${expenseHeight}%` }} title={`Expenses ${formatCurrency(bucket.expense)}`} />
                                        </div>
                                    </div>
                                    <span className="mt-2 text-[11px] text-slate-400">{bucket.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </article>

                <article className="panel-card p-5 sm:p-6">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-slate-900">Spending by category</h2>
                        <p className="mt-1 text-sm text-slate-500">{periodName} expense breakdown</p>
                    </div>
                    <div className="flex items-center justify-center py-1">
                        <div className="donut-chart" style={{ background: categories.length ? `conic-gradient(${donut})` : '#e9eef2' }}>
                            <div className="donut-hole">
                                <span className="text-[11px] font-medium text-slate-400">TOTAL SPENT</span>
                                <strong className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(expenses)}</strong>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 space-y-3">
                        {categories.slice(0, 4).map((item) => (
                            <div key={item.category} className="flex items-center justify-between gap-3 text-sm">
                                <span className="flex min-w-0 items-center gap-2 text-slate-600"><i className="legend-dot shrink-0" style={{ backgroundColor: item.color }} /><span className="truncate">{item.category}</span></span>
                                <span className="shrink-0 font-semibold text-slate-800">{formatCurrency(item.amount)}</span>
                            </div>
                        ))}
                        {!categories.length && <p className="py-2 text-center text-sm text-slate-400">No expenses in this period yet.</p>}
                    </div>
                </article>
            </section>

            <section className="panel-card overflow-hidden">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Transactions</h2>
                        <p className="mt-1 text-sm text-slate-500">A closer look at your money moves</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label className="relative block">
                            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input className="form-control pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" />
                        </label>
                        <button onClick={exportCsv} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
                            <Icon name="download" className="h-4 w-4" /> Export CSV
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-3 px-5 pt-4 sm:px-6">
                    <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Filter transactions by type">
                        {['all', 'income', 'expense'].map((filter) => (
                            <button key={filter} onClick={() => setTypeFilter(filter)} role="tab" aria-selected={typeFilter === filter} className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition ${typeFilter === filter ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{filter}</button>
                        ))}
                    </div>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400"><Icon name="calendar" className="h-3.5 w-3.5" />{periodName}</span>
                </div>
                <div className="divide-y divide-slate-100 px-5 pb-2 pt-2 sm:px-6">
                    {loading ? (
                        <p className="py-12 text-center text-sm text-slate-400">Loading your transactions…</p>
                    ) : visibleTransactions.length ? visibleTransactions.map((transaction) => (
                        <TransactionRow key={transaction.id} transaction={transaction} onEdit={() => openEdit(transaction)} onDelete={() => handleDelete(transaction)} />
                    )) : (
                        <div className="py-12 text-center">
                            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="wallet" /></span>
                            <p className="font-semibold text-slate-700">Nothing to see here yet</p>
                            <p className="mt-1 text-sm text-slate-400">{search ? 'Try a different search.' : 'Add a transaction to get started.'}</p>
                        </div>
                    )}
                </div>
            </section>

            {modalOpen && (
                <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
                    <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 id="transaction-title" className="text-xl font-bold text-slate-900">{editing ? 'Edit transaction' : 'Add a transaction'}</h2>
                                <p className="mt-1 text-sm text-slate-500">Keep your finances up to date.</p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close dialog"><Icon name="close" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                                {['expense', 'income'].map((type) => <button key={type} type="button" onClick={() => handleTypeChange(type)} className={`rounded-lg py-2.5 text-sm font-semibold capitalize ${form.type === type ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{type}</button>)}
                            </div>
                            <label className="block text-sm font-semibold text-slate-700">Description<input required maxLength="100" className="form-control mt-1.5 w-full" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="e.g. Coffee with a friend" /></label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="block text-sm font-semibold text-slate-700">Amount<input required min="0.01" step="0.01" type="number" className="form-control mt-1.5 w-full" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0.00" /></label>
                                <label className="block text-sm font-semibold text-slate-700">Date<input required type="date" className="form-control mt-1.5 w-full" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
                            </div>
                            <label className="block text-sm font-semibold text-slate-700">Category<select required className="form-control mt-1.5 w-full" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((category) => <option key={category}>{category}</option>)}</select></label>
                            <button disabled={saving} className="mt-2 w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-wait disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Save changes' : 'Add transaction'}</button>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
};

const SummaryCard = ({ title, amount, icon, color, subtitle }) => (
    <article className="panel-card p-5">
        <div className="flex items-start justify-between">
            <span className={`summary-icon summary-icon-${color}`}><Icon name={icon} /></span>
            <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-400">LIVE</span>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{typeof amount === 'number' ? formatCurrency(amount) : amount}</p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
    </article>
);

const PeriodSelector = ({ value, onChange }) => (
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1" aria-label="Choose report period">
        {[['daily', 'Day'], ['weekly', 'Week'], ['monthly', 'Month']].map(([period, label]) => (
            <button key={period} onClick={() => onChange(period)} aria-pressed={value === period} className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${value === period ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{label}</button>
        ))}
    </div>
);

const TransactionRow = ({ transaction, onEdit, onDelete }) => (
    <article className="flex items-center gap-3 py-4 sm:gap-4">
        <span className={`transaction-mark ${transaction.type === 'income' ? 'transaction-mark-income' : 'transaction-mark-expense'}`}><Icon name={transaction.type === 'income' ? 'arrowDown' : 'arrowUp'} className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">{transaction.description}</p>
            <p className="mt-1 text-xs text-slate-400">{transaction.category} <span className="px-1">·</span> {new Date(`${transaction.date}T00:00:00`).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <p className={`whitespace-nowrap text-sm font-bold ${transaction.type === 'income' ? 'text-teal-700' : 'text-slate-800'}`}>{transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount)}</p>
        <div className="flex">
            <button onClick={onEdit} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label={`Edit ${transaction.description}`}><Icon name="edit" className="h-4 w-4" /></button>
            <button onClick={onDelete} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${transaction.description}`}><Icon name="trash" className="h-4 w-4" /></button>
        </div>
    </article>
);

export default Dashboard;
