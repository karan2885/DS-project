import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Trash2, 
  X,
  Calendar,
  Building,
  CheckCircle2,
  IndianRupee,
  Layers
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { getExpenses, createExpense, deleteExpense, getExpenseOverview } from '../services/api';
import { formatINR, formatDateIndian } from '../utils/formatters';

export default function ExpensesPage({ showToast }) {
  const [expenses, setExpenses] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    category: 'Electricity Bill',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    paidTo: '',
    paymentMethod: 'BANK_TRANSFER',
    approvedBy: 'Admin'
  });

  useEffect(() => {
    loadData();
  }, [categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, ovRes] = await Promise.all([
        getExpenses(categoryFilter === 'ALL' ? null : categoryFilter),
        getExpenseOverview()
      ]);
      setExpenses(expRes.data || []);
      setOverview(ovRes.data || null);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to load society expenses' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createExpense({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      showToast({ 
        type: 'success', 
        title: 'Expense Recorded', 
        message: `Recorded ${formatINR(formData.amount)} for ${formData.category} in society ledger.` 
      });
      setIsModalOpen(false);
      setFormData({
        category: 'Electricity Bill',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
        description: '',
        paidTo: '',
        paymentMethod: 'BANK_TRANSFER',
        approvedBy: 'Admin'
      });
      loadData();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to create expense' });
    }
  };

  const handleDelete = async (id, desc) => {
    if (window.confirm(`Delete expense record "${desc}"?`)) {
      try {
        await deleteExpense(id);
        showToast({ type: 'success', message: 'Expense record deleted.' });
        loadData();
      } catch (err) {
        showToast({ type: 'error', message: 'Failed to delete expense' });
      }
    }
  };

  const categories = [
    'ALL',
    'Electricity Bill',
    'Security Services',
    'Housekeeping & Cleaning',
    'Lift AMC & Maintenance',
    'Gardening & Landscaping',
    'Water Tanker & Supply',
    'CCTV & Intercom Maintenance',
    'Plumbing & Drainage',
    'Generator Diesel & Backup',
    'Administrative & Legal'
  ];

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Maintenance Inflow</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">{formatINR(overview?.totalIncome || 0)}</div>
            <span className="text-[11px] text-slate-400">Resident collections</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Expenses Outflow</span>
            <div className="text-xl font-bold text-rose-600 mt-1">{formatINR(overview?.totalExpenses || 0)}</div>
            <span className="text-[11px] text-slate-400">Society maintenance expenses</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Net Society Reserve</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(overview?.netBalance || 0)}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Safe operating surplus</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Bar & Categories */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="flex items-center gap-2 overflow-x-auto max-w-2xl py-0.5">
          {categories.slice(0, 6).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-1.5 rounded-lg transition-colors shadow-xs ml-auto"
        >
          <Plus className="w-4 h-4" /> Record Society Expense
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Voucher ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Vendor / Paid To</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {e.expenseId}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {formatDateIndian(e.expenseDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-800 max-w-xs truncate" title={e.description}>
                      {e.description}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {e.paidTo || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {e.paymentMethod || 'Bank Transfer'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                      {formatINR(e.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(e.id, e.description)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete voucher"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Record Society Expenditure</h3>
                <p className="text-[11px] text-slate-500">Persisted into MongoDB &amp; tracked in JVM ArrayList</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Expense Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                >
                  <option value="Electricity Bill">Electricity Bill (UGVCL / DGVCL)</option>
                  <option value="Security Services">Security Services Agency</option>
                  <option value="Housekeeping & Cleaning">Housekeeping &amp; Cleaning</option>
                  <option value="Lift AMC & Maintenance">Lift AMC &amp; Maintenance (Schindler / Otis)</option>
                  <option value="Gardening & Landscaping">Gardening &amp; Landscaping</option>
                  <option value="Water Tanker & Supply">Water Tanker &amp; Municipal Supply</option>
                  <option value="CCTV & Intercom Maintenance">CCTV &amp; Intercom Maintenance</option>
                  <option value="Plumbing & Drainage">Plumbing &amp; Drainage Repairs</option>
                  <option value="Generator Diesel & Backup">Generator Diesel &amp; Backup</option>
                  <option value="Administrative & Legal">Administrative &amp; Audit Fees</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Amount (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="e.g. 12500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Vendor / Payee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Surat Power Distribution Co."
                  value={formData.paidTo}
                  onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description / Bill Reference *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="Monthly pump room electricity bill and common area lighting..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs"
                >
                  Record Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
