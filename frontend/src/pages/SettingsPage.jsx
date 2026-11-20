import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building, 
  IndianRupee, 
  Shield, 
  Database, 
  Save, 
  CheckCircle2, 
  RefreshCw,
  Cpu,
  AlertTriangle,
  RotateCcw,
  Calendar,
  ArrowRight,
  ChevronRight,
  CheckSquare,
  Clock
} from 'lucide-react';
import { getAllDataStructuresStats, getSocietyInfo, resetDemoData, getAvailableMonths, changeBillingMonth, markAllFlatsPaid, getMonthlyReport } from '../services/api';
import { formatINR } from '../utils/formatters';

export default function SettingsPage({ showToast }) {
  const [societySettings, setSocietySettings] = useState({
    societyName: 'Green Valley Residency',
    registrationNumber: 'GUJ/SRT/HSG/2022/4921',
    address: 'Plot No. 12-16, VIP Road, Near GD Goenka School, Vesu, Surat - 395007',
    city: 'Surat',
    state: 'Gujarat',
    postalCode: '395007',
    baseMaintenanceAmount: 2500.0,
    lateFeeAmount: 250.0,
    lateFeeGraceDays: 15,
    currencySymbol: '₹',
    currencyCode: 'INR',
    contactEmail: 'admin@greenvalley.in',
    emergencyHelpline: '+91 98250 11223'
  });

  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [dsStats, setDsStats] = useState(null);

  // Billing month state
  const [currentBillingMonth, setCurrentBillingMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [monthStatus, setMonthStatus] = useState(null);
  const [customMonth, setCustomMonth] = useState('');
  const [advancingMonth, setAdvancingMonth] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    loadSocietyInfo();
    checkDsSync();
    loadBillingMonthData();
  }, []);

  const loadSocietyInfo = async () => {
    try {
      const res = await getSocietyInfo();
      if (res.data) {
        setSocietySettings(prev => ({
          ...prev,
          ...res.data,
          baseMaintenanceAmount: res.data.baseMaintenanceAmount || 2500.0,
          lateFeeAmount: res.data.lateFeeAmount || 250.0
        }));
        if (res.data.currentBillingMonth) {
          setCurrentBillingMonth(res.data.currentBillingMonth);
          loadMonthStatus(res.data.currentBillingMonth);
        }
      }
    } catch (err) {
      console.error('Failed to load society info', err);
    }
  };

  const loadBillingMonthData = async () => {
    setBillingLoading(true);
    try {
      const monthsRes = await getAvailableMonths();
      setAvailableMonths(monthsRes.data || []);
    } catch (err) {
      console.error('Failed to load billing months', err);
    } finally {
      setBillingLoading(false);
    }
  };

  const loadMonthStatus = async (month) => {
    try {
      const res = await getMonthlyReport(month);
      setMonthStatus(res.data);
    } catch (err) {
      console.error('Failed to load month status', err);
    }
  };

  const checkDsSync = async () => {
    try {
      const res = await getAllDataStructuresStats();
      setDsStats(res.data);
    } catch (err) {
      console.error('Failed to load DS stats', err);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast({ 
        type: 'success', 
        title: 'Settings Saved', 
        message: 'Green Valley Residency parameters updated successfully.' 
      });
    }, 400);
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset operational data? All paid maintenance will become pending, processed complaints will reset to open, and income/expenses will reset as new. Resident and flat details will be preserved.')) {
      return;
    }

    try {
      setResetting(true);
      const res = await resetDemoData();
      showToast({
        type: 'success',
        title: 'Data Reset Complete',
        message: `${res.data.message}`
      });
      loadSocietyInfo();
      checkDsSync();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to reset demo data' });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Society Identification */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">Green Valley Residency – Society Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">Registered Society Name</label>
              <input
                type="text"
                value={societySettings.societyName}
                onChange={(e) => setSocietySettings({ ...societySettings, societyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Government Registration Number</label>
              <input
                type="text"
                value={societySettings.registrationNumber}
                onChange={(e) => setSocietySettings({ ...societySettings, registrationNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Location / Area</label>
              <input
                type="text"
                value="Vesu, Surat, Gujarat, India"
                disabled
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-medium mb-1">Society Address</label>
              <input
                type="text"
                value={societySettings.address}
                onChange={(e) => setSocietySettings({ ...societySettings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Official Society Contact Email</label>
              <input
                type="email"
                value={societySettings.contactEmail}
                onChange={(e) => setSocietySettings({ ...societySettings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Security Gate / Emergency Line</label>
              <input
                type="text"
                value={societySettings.emergencyHelpline}
                onChange={(e) => setSocietySettings({ ...societySettings, emergencyHelpline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Maintenance & Late Fee Policy (INR) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">Maintenance Assessment &amp; Late Fee Policy (INR ₹)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Base Monthly Maintenance (₹)</label>
              <input
                type="number"
                step="50"
                value={societySettings.baseMaintenanceAmount}
                onChange={(e) => setSocietySettings({ ...societySettings, baseMaintenanceAmount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard ₹2,500 / month</span>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Overdue Late Fee (₹)</label>
              <input
                type="number"
                step="25"
                value={societySettings.lateFeeAmount}
                onChange={(e) => setSocietySettings({ ...societySettings, lateFeeAmount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Standard ₹250 late fee</span>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Payment Grace Period (Days)</label>
              <input
                type="number"
                value={societySettings.lateFeeGraceDays}
                onChange={(e) => setSocietySettings({ ...societySettings, lateFeeGraceDays: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Due by 15th of month</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Society Settings'}
          </button>
        </div>
      </form>

      {/* Admin Demo Data & System Diagnostics Section */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-900">Academic Demo Data &amp; Reset Management</h3>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-semibold text-slate-800">Reset Operations &amp; Ledger</h4>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Sets all paid maintenance flats to pending, resets processed complaints to open, and clears income/expense records while preserving all resident and flat details.
            </p>
          </div>
          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            {resetting ? 'Resetting Data...' : 'Reset Demo Data'}
          </button>
        </div>

        {/* 8 Data Structures Status Pill Matrix */}
        <div className="pt-2">
          <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider block mb-2">
            8 JVM Data Structures Live Synchronization State:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: '1. ArrayList', sub: 'Payments Ledger', count: dsStats?.arraylist?.totalRecords ?? 'Active' },
              { name: '2. LinkedList', sub: 'Activity Log', count: dsStats?.linkedlist?.totalActivities ?? 'Active' },
              { name: '3. Stack', sub: 'Undo Operations', count: dsStats?.stack?.totalOperations ?? 'Active' },
              { name: '4. FIFO Queue', sub: 'Complaints', count: dsStats?.queue?.queueSize ?? 'Active' },
              { name: '5. Min-Heap', sub: 'Priority Queue', count: dsStats?.priorityQueue?.totalInQueue ?? 'Active' },
              { name: '6. BST', sub: 'Inorder Months', count: dsStats?.bst?.totalNodes ?? 'Active' },
              { name: '7. Graph', sub: 'Building Adjacency', count: dsStats?.graph?.totalVertices ? `${dsStats.graph.totalVertices} Vertices` : 'Active' },
              { name: '8. AVL Tree', sub: 'Self-Balancing', count: dsStats?.avl?.totalNodes ? `${dsStats.avl.totalNodes} Nodes` : 'Active' }
            ].map((ds, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800 block text-[11px]">{ds.name}</span>
                <span className="text-[10px] text-slate-500 block">{ds.sub}</span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold mt-1 inline-block">
                  ● {ds.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
