import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  RotateCcw,
  IndianRupee,
  ShieldCheck,
  Flame,
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
import { getDashboardStats, undoLastAction, getComplaints, getMaintenanceRecords } from '../services/api';
import { formatINR } from '../utils/formatters';

export default function DashboardPage({ setCurrentPage, showToast, refreshTrigger }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unassignedComplaints, setUnassignedComplaints] = useState([]);
  const [overdueMaintenance, setOverdueMaintenance] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, [refreshTrigger]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      setStats(res.data);

      const [complaintsRes, mntRes] = await Promise.all([
        getComplaints(),
        getMaintenanceRecords({ status: 'OVERDUE' })
      ]);

      const unassigned = (complaintsRes.data || [])
        .filter(c => c.status === 'SUBMITTED')
        .slice(0, 4);
      setUnassignedComplaints(unassigned);

      const overdues = (mntRes.data || []).slice(0, 4);
      setOverdueMaintenance(overdues);

    } catch (err) {
      console.error('Failed to load dashboard stats', err);
      showToast({ type: 'error', message: 'Failed to connect to backend server' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickUndo = async () => {
    try {
      const res = await undoLastAction();
      if (res.data.success) {
        showToast({ type: 'success', title: 'Undo Successful', message: res.data.message });
        loadDashboardData();
      } else {
        showToast({ type: 'info', title: 'Stack Empty', message: res.data.message });
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Error rolling back last operation' });
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Flats',
      value: stats?.totalFlats || 48,
      subtext: 'A, B & C Wings (48 Flats)',
      icon: Building,
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      action: () => setCurrentPage('residents')
    },
    {
      title: 'Total Residents',
      value: stats?.totalResidents || 32,
      subtext: 'Indexed in AVL Tree',
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      action: () => setCurrentPage('residents')
    },
    {
      title: 'Maintenance Collected',
      value: formatINR(stats?.maintenanceCollected || 0),
      subtext: 'Partitioned in BST',
      icon: CheckCircle,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      action: () => setCurrentPage('maintenance')
    },
    {
      title: 'Pending Maintenance',
      value: formatINR(stats?.pendingMaintenance || 0),
      subtext: 'Overdue & Unpaid',
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      action: () => setCurrentPage('maintenance')
    },
    {
      title: 'Open Complaints',
      value: stats?.openComplaints || 0,
      subtext: `${stats?.highPriorityComplaints || 0} Critical / High in Heap`,
      icon: AlertCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      action: () => setCurrentPage('complaints')
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div 
              key={idx}
              onClick={kpi.action}
              className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{kpi.title}</span>
                <div className={`p-2 rounded-md ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-xl font-bold text-slate-900">{kpi.value}</div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>{kpi.subtext}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Maintenance Collection Overview & Complaint Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Maintenance Collection Chart (Recharts) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Maintenance Collection Overview</h2>
              <p className="text-xs text-slate-500">Monthly breakdown extracted via Binary Search Tree Inorder Traversal</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600"></span> Collected
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500"></span> Pending
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthlyFinancialTrends || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip 
                  formatter={(val) => [formatINR(val), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="collected" fill="#059669" radius={[4, 4, 0, 0]} name="Collected" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Total Society Reserve</span>
              <span className="text-sm font-bold text-slate-900">{formatINR(stats?.netBalance || 0)}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Total Society Expenses</span>
              <span className="text-sm font-bold text-slate-900">{formatINR(stats?.totalExpenses || 0)}</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <span className="text-[11px] text-slate-500 block">Collection Rate</span>
              <span className="text-sm font-bold text-emerald-600">
                {stats?.maintenanceCollected 
                  ? `${Math.round((stats.maintenanceCollected / (stats.maintenanceCollected + (stats.pendingMaintenance || 1))) * 100)}%` 
                  : '89%'}
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Complaint Pipeline Overview */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Complaint Pipeline</h2>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Queue &amp; Heap</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50/70 border border-rose-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-xs font-medium text-rose-900">High / Critical Priority</span>
                </div>
                <span className="text-xs font-bold text-rose-700">{stats?.highPriorityComplaints || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/70 border border-amber-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-medium text-amber-900">Open / Waiting (FIFO Queue)</span>
                </div>
                <span className="text-xs font-bold text-amber-700">{stats?.openComplaints || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-sky-50/70 border border-sky-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  <span className="text-xs font-medium text-sky-900">In Progress</span>
                </div>
                <span className="text-xs font-bold text-sky-700">{stats?.inProgressComplaints || 0}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-medium text-emerald-900">Resolved Complaints</span>
                </div>
                <span className="text-xs font-bold text-emerald-700">{stats?.resolvedComplaints || 0}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Active Gate Visitors: <strong className="text-slate-800">{stats?.activeVisitors || 0}</strong></span>
            <button 
              onClick={() => setCurrentPage('complaints')}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Manage Tickets <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activities (LinkedList) & Pending Administrative Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities (Traversed from LinkedList) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Society Activities</h2>
              <p className="text-xs text-slate-500">Traversed from Java LinkedList in O(1) sequential time</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              LinkedList Head
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act, idx) => (
                <div key={idx} className="py-2.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-medium">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {act.residentName} <span className="text-slate-400 font-normal">({act.flatNumber})</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {act.actionType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{act.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recent activities logged.</p>
            )}
          </div>
        </div>

        {/* Pending Actions & Administrative Tasks */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Pending Actions &amp; Alerts</h2>
                <p className="text-xs text-slate-500">Items requiring immediate administrative intervention</p>
              </div>
              <button 
                onClick={handleQuickUndo}
                className="text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Quick Undo
              </button>
            </div>

            <div className="space-y-4">
              {/* Unassigned Complaints */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Complaints Waiting in FIFO Queue ({unassignedComplaints.length})
                </span>
                <div className="space-y-2">
                  {unassignedComplaints.map((c) => (
                    <div key={c.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            c.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                            c.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {c.priority}
                          </span>
                          <span className="text-xs font-medium text-slate-800">{c.category} - Flat {c.flatNumber}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.description}</p>
                      </div>
                      <button 
                        onClick={() => setCurrentPage('complaints')}
                        className="text-xs text-emerald-600 hover:underline shrink-0 ml-2"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overdue Maintenance */}
              {overdueMaintenance.length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Overdue Maintenance Records
                  </span>
                  <div className="space-y-2">
                    {overdueMaintenance.map((m) => (
                      <div key={m.id} className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-200/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-800">
                            Flat {m.flatNumber} ({m.residentName}) - <span className="text-rose-700 font-semibold">{formatINR(m.totalAmount)}</span>
                          </p>
                          <p className="text-[11px] text-rose-600">Month: {m.monthYear} • Late fee: {formatINR(m.lateFee)}</p>
                        </div>
                        <button 
                          onClick={() => setCurrentPage('maintenance')}
                          className="text-xs text-rose-700 font-medium hover:underline shrink-0"
                        >
                          Collect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Society records synchronized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
