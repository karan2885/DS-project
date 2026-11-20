import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Download,
  Calendar,
  Printer,
  X,
  Building,
  FileText,
  IndianRupee,
  Layers
} from 'lucide-react';
import { 
  getMaintenanceRecords, 
  payMaintenance, 
  updateMaintenanceStatus,
  getChronologicalReports,
  getMonthlyReport
} from '../services/api';
import { formatINR, formatDateIndian } from '../utils/formatters';

export default function MaintenancePage({ showToast }) {
  const [activeTab, setActiveTab] = useState('records'); // 'records', 'bstReports'
  const [records, setRecords] = useState([]);
  const [bstReports, setBstReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Pay Modal
  const [payingRecord, setPayingRecord] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (activeTab === 'records') {
      loadRecords();
    } else {
      loadBstReports();
    }
  }, [activeTab, monthFilter, buildingFilter, statusFilter]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await getMaintenanceRecords({
        month: monthFilter,
        building: buildingFilter,
        status: statusFilter
      });
      setRecords(res.data || []);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to load maintenance records' });
    } finally {
      setLoading(false);
    }
  };

  const loadBstReports = async () => {
    try {
      setLoading(true);
      const res = await getChronologicalReports();
      setBstReports(res.data || []);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to fetch BST chronological reports' });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payingRecord) return;
    try {
      const res = await payMaintenance(payingRecord.id, paymentMethod);
      showToast({ 
        type: 'success', 
        title: 'Payment Recorded', 
        message: `Received ${formatINR(res.data.totalAmount)} for Flat ${res.data.flatNumber}. Official receipt generated.` 
      });
      setPayingRecord(null);
      loadRecords();
      setSelectedReceipt(res.data);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to process payment' });
    }
  };

  // Financial aggregates
  const totalCollected = records
    .filter(r => r.paymentStatus === 'PAID')
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const totalPending = records
    .filter(r => r.paymentStatus === 'UNPAID' || r.paymentStatus === 'OVERDUE')
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const overdueCount = records.filter(r => r.paymentStatus === 'OVERDUE').length;

  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const paginatedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Collected</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalCollected)}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Recorded in ArrayList &amp; BST</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Pending Collections</span>
            <div className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalPending)}</div>
            <span className="text-[11px] text-amber-600 font-medium">{records.filter(r => r.paymentStatus !== 'PAID').length} flats pending</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Overdue Notices</span>
            <div className="text-xl font-bold text-rose-600 mt-1">{overdueCount} Flats</div>
            <span className="text-[11px] text-rose-500 font-medium">+₹250 late fee assessed</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'records'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Resident Payment Ledger ({records.length})
        </button>
        <button
          onClick={() => setActiveTab('bstReports')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'bstReports'
              ? 'border-emerald-600 text-emerald-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          BST Chronological Financial Reports
        </button>
      </div>

      {activeTab === 'records' ? (
        <>
          {/* Action Bar & Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>

              {/* Month Filter */}
              <select
                value={monthFilter}
                onChange={(e) => { setMonthFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white"
              >
                <option value="ALL">All Months</option>
                <option value="2026-03">March 2026</option>
                <option value="2026-02">February 2026</option>
                <option value="2026-01">January 2026</option>
                <option value="2025-12">December 2025</option>
                <option value="2025-11">November 2025</option>
              </select>

              {/* Building Filter */}
              <select
                value={buildingFilter}
                onChange={(e) => { setBuildingFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white"
              >
                <option value="ALL">All Wings</option>
                <option value="A Wing">A Wing</option>
                <option value="B Wing">B Wing</option>
                <option value="C Wing">C Wing</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Pending</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div className="text-slate-400 font-mono text-[11px]">
              Showing {paginatedRecords.length} of {records.length} records
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Invoice / Flat</th>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4">Wing</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Base Fee</th>
                    <th className="py-3 px-4">Late Fee</th>
                    <th className="py-3 px-4 font-bold">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Payment Info</th>
                    <th className="py-3 px-4 text-right">Receipt / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="py-8 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </td>
                    </tr>
                  ) : paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-8 text-center text-slate-400">
                        No maintenance records found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{r.flatNumber}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{r.recordId}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {r.residentName}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {r.building}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {r.monthYear}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {formatINR(r.amount)}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {r.lateFee > 0 ? (
                            <span className="text-rose-600 font-semibold">+{formatINR(r.lateFee)}</span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {formatINR(r.totalAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                            r.paymentStatus === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.paymentStatus === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {r.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {r.paymentStatus === 'PAID' ? (
                            <div>
                              <span className="font-medium text-slate-800 block">{r.paymentMethod || 'UPI'}</span>
                              <span className="text-slate-400">{formatDateIndian(r.paymentDate)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Due: {formatDateIndian(r.dueDate)}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.paymentStatus === 'PAID' ? (
                            <button
                              onClick={() => setSelectedReceipt(r)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Receipt className="w-3 h-3 text-slate-500" /> Receipt
                            </button>
                          ) : (
                            <button
                              onClick={() => setPayingRecord(r)}
                              className="px-2.5 py-1 text-[11px] font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors shadow-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CreditCard className="w-3 h-3" /> Record Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>Page {currentPage} of {totalPages}</span>
                <div className="flex gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        /* BST Chronological Reports Tab */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between text-xs">
            <div>
              <h3 className="font-semibold text-slate-900">Binary Search Tree (BST) Financial Traversal</h3>
              <p className="text-slate-500">Inorder traversal strictly guarantees chronological progression: Left Subtree &lt; Root &lt; Right Subtree</p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded font-mono text-xs border border-indigo-200">
              O(N) BST Inorder
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bstReports.map((summary, idx) => (
              <div key={idx} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 font-mono text-sm">{summary.monthYear}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    Node #{idx + 1}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-emerald-50/60 rounded border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 uppercase block">Collected</span>
                    <strong className="text-emerald-700 font-mono">{formatINR(summary.totalCollected)}</strong>
                    <span className="text-[10px] text-emerald-600 block">{summary.paidCount} flats</span>
                  </div>
                  <div className="p-2 bg-amber-50/60 rounded border border-amber-100">
                    <span className="text-[10px] text-amber-800 uppercase block">Pending</span>
                    <strong className="text-amber-700 font-mono">{formatINR(summary.totalPending)}</strong>
                    <span className="text-[10px] text-amber-600 block">{summary.pendingCount} flats</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Total Assessed: {summary.totalRecords} Flats</span>
                  <span className="font-semibold text-slate-700">
                    {Math.round((summary.paidCount / (summary.totalRecords || 1)) * 100)}% Fulfilled
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Maintenance Modal */}
      {payingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Record Maintenance Payment</h3>
                <p className="text-[11px] text-slate-500">Flat {payingRecord.flatNumber} • {payingRecord.residentName}</p>
              </div>
              <button onClick={() => setPayingRecord(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePay} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 border border-slate-200 text-slate-600">
                <div className="flex justify-between">
                  <span>Base Charge:</span>
                  <span className="font-mono text-slate-800">{formatINR(payingRecord.amount)}</span>
                </div>
                {payingRecord.lateFee > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Overdue Late Fee:</span>
                    <span className="font-mono">+{formatINR(payingRecord.lateFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                  <span>Total Payable:</span>
                  <span className="font-mono text-emerald-700">{formatINR(payingRecord.totalAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                  <option value="Cash">Cash (Society Office Desk)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingRecord(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs"
                >
                  Confirm &amp; Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Indian Society Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-semibold text-slate-700">Official Society Maintenance Receipt</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-6 text-xs space-y-5 bg-white">
              {/* Receipt Header */}
              <div className="border-b border-slate-200 pb-4 text-center">
                <h2 className="text-base font-bold text-slate-900">Green Valley Residency</h2>
                <p className="text-[11px] text-slate-500">
                  Plot No. 12-16, VIP Road, Near GD Goenka School, Vesu, Surat, Gujarat - 395007
                </p>
                <p className="text-[10px] text-slate-400 font-mono">Reg. No: GUJ/SRT/HSG/2022/4921</p>
                <div className="mt-3 inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-semibold text-[11px]">
                  MAINTENANCE ASSESSMENT RECEIPT (INR)
                </div>
              </div>

              {/* Receipt Meta */}
              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="block text-[11px] text-slate-400">Receipt Number</span>
                  <strong className="font-mono text-slate-900">{selectedReceipt.receiptNumber || 'RCP-2026-0091'}</strong>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-slate-400">Payment Date</span>
                  <span className="font-mono text-slate-900">{formatDateIndian(selectedReceipt.paymentDate)}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Received From</span>
                  <span className="font-semibold text-slate-900">{selectedReceipt.residentName}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[11px] text-slate-400">Flat &amp; Building</span>
                  <span className="font-mono font-semibold text-slate-900">Flat {selectedReceipt.flatNumber} ({selectedReceipt.building})</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Period</th>
                      <th className="p-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 text-slate-800">Monthly Society Maintenance Assessment</td>
                      <td className="p-2.5 text-slate-600 font-mono">{selectedReceipt.monthYear}</td>
                      <td className="p-2.5 text-right font-mono">{formatINR(selectedReceipt.amount)}</td>
                    </tr>
                    {selectedReceipt.lateFee > 0 && (
                      <tr>
                        <td className="p-2.5 text-rose-600">Overdue Late Payment Penalty</td>
                        <td className="p-2.5 text-slate-600 font-mono">{selectedReceipt.monthYear}</td>
                        <td className="p-2.5 text-right font-mono text-rose-600">+{formatINR(selectedReceipt.lateFee)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                    <tr>
                      <td colSpan="2" className="p-2.5 text-right">Total Paid via {selectedReceipt.paymentMethod || 'UPI'}:</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700">{formatINR(selectedReceipt.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Stamp and Note */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                <span>Computer generated official receipt • Green Valley Residency</span>
                <span className="text-emerald-700 font-semibold px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                  STATUS: PAID
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
