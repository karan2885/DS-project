import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Plus, 
  Clock, 
  LogOut, 
  ShieldCheck, 
  AlertCircle,
  X,
  Phone,
  Car,
  Home
} from 'lucide-react';
import { getVisitors, registerVisitor, checkoutVisitor } from '../services/api';

export default function VisitorsPage({ showToast }) {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'ACTIVE', 'CHECKED_OUT'
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    visitingFlat: '',
    purpose: 'Personal Guest',
    vehicleNumber: '',
    securityGuard: 'Vikram Rathod (Main Gate)'
  });

  useEffect(() => {
    loadVisitors();
  }, [statusFilter, searchQuery]);

  const loadVisitors = async () => {
    try {
      setLoading(true);
      const res = await getVisitors({
        search: searchQuery,
        status: statusFilter
      });
      setVisitors(res.data || []);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to load visitors' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await registerVisitor(formData);
      showToast({ 
        type: 'success', 
        title: 'Visitor Checked In', 
        message: `${res.data.name} entry recorded for Flat ${res.data.visitingFlat}.` 
      });
      setIsRegisterOpen(false);
      setFormData({
        name: '',
        phone: '',
        visitingFlat: '',
        purpose: 'Personal Guest',
        vehicleNumber: '',
        securityGuard: 'Vikram Rathod (Main Gate)'
      });
      loadVisitors();
    } catch (err) {
      // Duplicate phone active visitor validation alert
      const errMsg = err.response?.data?.error || 'Registration failed. Check active visitor records.';
      showToast({ type: 'error', title: 'Gate Validation Alert', message: errMsg });
    }
  };

  const handleCheckout = async (visitor) => {
    try {
      await checkoutVisitor(visitor.id);
      showToast({ 
        type: 'success', 
        title: 'Visitor Checked Out', 
        message: `${visitor.name} exit recorded at security kiosk.` 
      });
      loadVisitors();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to record visitor exit' });
    }
  };

  const activeCount = visitors.filter(v => v.status === 'ACTIVE').length;

  return (
    <div className="space-y-5">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Currently Inside Society</span>
            <span className="text-2xl font-bold text-emerald-700">{activeCount} Visitors</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Active passes at gate</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Total Logged Today</span>
            <span className="text-2xl font-bold text-slate-900">{visitors.length}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Deliveries, guests & services</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-slate-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">Security Protocol</span>
            <span className="text-sm font-semibold text-slate-800">Duplicate Phone Guard Active</span>
            <span className="text-[11px] text-emerald-600 block mt-0.5">Prevents re-entry before exit</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search visitor by name, phone, or flat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5"
          >
            <option value="ALL">All Visitor Records</option>
            <option value="ACTIVE">Currently Inside (Active)</option>
            <option value="CHECKED_OUT">Checked Out (Exited)</option>
          </select>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Register Visitor
          </button>
        </div>
      </div>

      {/* Visitor Listing Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Visitor Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Visiting Flat</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Vehicle No.</th>
                <th className="py-3 px-4">Entry Time</th>
                <th className="py-3 px-4">Exit Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">
                    No visitor records found.
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {v.name}
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">{v.visitorId}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {v.phone || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-800">
                      Flat {v.visitingFlat}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {v.purpose}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {v.vehicleNumber || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {v.entryTime ? v.entryTime.replace('T', ' ').substring(0, 16) : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {v.exitTime ? v.exitTime.replace('T', ' ').substring(0, 16) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {v.status === 'ACTIVE' ? 'Inside (Active)' : 'Exited'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.status === 'ACTIVE' ? (
                        <button
                          onClick={() => handleCheckout(v)}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <LogOut className="w-3 h-3" /> Check Out
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Archived</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Visitor Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Gate Visitor Entry</h3>
                <p className="text-[11px] text-slate-500">Security gate registration with active phone deduplication</p>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98250 54321"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Visiting Flat *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-101"
                    value={formData.visitingFlat}
                    onChange={(e) => setFormData({ ...formData, visitingFlat: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Purpose of Visit *</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  >
                    <option value="Personal Guest">Personal Guest</option>
                    <option value="Package Delivery">Package Delivery</option>
                    <option value="Home Maintenance">Home Maintenance</option>
                    <option value="Cab / Transport">Cab / Transport</option>
                    <option value="Official Visit">Official Visit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Vehicle License No.</label>
                  <input
                    type="text"
                    placeholder="e.g. DL-04-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Gate Officer / Kiosk</label>
                <input
                  type="text"
                  value={formData.securityGuard}
                  onChange={(e) => setFormData({ ...formData, securityGuard: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs"
                >
                  Issue Gate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
