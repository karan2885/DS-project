import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  UserPlus, 
  CheckCircle2, 
  Flame, 
  X, 
  ChevronRight,
  TrendingUp,
  User,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  Check,
  AlertTriangle,
  RotateCcw,
  FileText,
  Wrench,
  CheckSquare,
  Lock,
  Unlock,
  Layers,
  Info
} from 'lucide-react';
import { 
  getComplaints, 
  registerComplaintDto, 
  assignComplaintDto,
  resolveComplaint,
  closeComplaint,
  reopenComplaint,
  updateComplaintPriority,
  assignNextFifo,
  assignNextPriority
} from '../services/api';
import { formatDateIndian, formatDateTimeIndian } from '../utils/formatters';

export default function ComplaintsPage({ showToast }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [assignModalComplaint, setAssignModalComplaint] = useState(null);
  const [resolveModalComplaint, setResolveModalComplaint] = useState(null);
  const [closeModalComplaint, setCloseModalComplaint] = useState(null);
  const [reopenModalComplaint, setReopenModalComplaint] = useState(null);
  const [priorityModalComplaint, setPriorityModalComplaint] = useState(null);
  const [detailModalComplaint, setDetailModalComplaint] = useState(null);
  const [detailTab, setDetailTab] = useState('timeline'); // 'timeline', 'details', 'resolution', 'closure'

  // Forms State
  const [registerForm, setRegisterForm] = useState({
    residentName: '',
    flatNumber: '',
    building: 'A Wing',
    category: 'PLUMBING',
    title: '',
    priority: 'MEDIUM',
    description: ''
  });

  const [assignForm, setAssignForm] = useState({
    staffName: 'Ramesh Verma (Senior Electrician)',
    staffContact: '+91 98251 44556',
    remarks: 'Assigned as per maintenance roster'
  });

  const [resolveForm, setResolveForm] = useState({
    resolutionDescription: '',
    workPerformed: '',
    resolvedBy: 'Ramesh Verma (Senior Electrician)',
    remarks: 'Tested and verified operational'
  });

  const [closeForm, setCloseForm] = useState({
    closureReason: '',
    closureCategory: 'RESOLVED_SATISFIED',
    closedBy: 'Society Admin'
  });

  const [reopenForm, setReopenForm] = useState({
    reopenedReason: '',
    updatedPriority: 'HIGH',
    reopenedBy: 'Resident'
  });

  const [newPriority, setNewPriority] = useState('HIGH');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await getComplaints();
      setComplaints(res.data || []);
      // If detail modal is open, refresh its data
      if (detailModalComplaint) {
        const updated = (res.data || []).find(c => c.id === detailModalComplaint.id);
        if (updated) setDetailModalComplaint(updated);
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to load complaints' });
    } finally {
      setLoading(false);
    }
  };

  // 1. Register Complaint
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await registerComplaintDto(registerForm);
      showToast({ 
        type: 'success', 
        title: 'Complaint Registered', 
        message: `Ticket ${res.data.complaintId} enqueued into FIFO Queue and Min-Heap Priority Queue.` 
      });
      setIsRegisterOpen(false);
      setRegisterForm({
        residentName: '',
        flatNumber: '',
        building: 'A Wing',
        category: 'PLUMBING',
        title: '',
        priority: 'MEDIUM',
        description: ''
      });
      loadComplaints();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to register complaint' });
    }
  };

  // 2. Assign Staff
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignModalComplaint) return;
    try {
      await assignComplaintDto(assignModalComplaint.id, {
        staffName: assignForm.staffName,
        staffContact: assignForm.staffContact,
        remarks: assignForm.remarks,
        assignedBy: 'Admin'
      });
      showToast({ 
        type: 'success', 
        title: 'Staff Assigned', 
        message: `Assigned ticket ${assignModalComplaint.complaintId} to ${assignForm.staffName}.` 
      });
      setAssignModalComplaint(null);
      loadComplaints();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to assign staff' });
    }
  };

  // 3. Resolve Complaint
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalComplaint) return;
    if (!resolveForm.resolutionDescription.trim() || !resolveForm.workPerformed.trim()) {
      showToast({ type: 'error', message: 'Both Resolution Description and Work Performed are mandatory!' });
      return;
    }

    try {
      await resolveComplaint(resolveModalComplaint.id, {
        resolutionDescription: resolveForm.resolutionDescription.trim(),
        workPerformed: resolveForm.workPerformed.trim(),
        resolvedBy: resolveForm.resolvedBy,
        remarks: resolveForm.remarks
      });
      showToast({ 
        type: 'success', 
        title: 'Complaint Resolved', 
        message: `Ticket ${resolveModalComplaint.complaintId} resolved. Ready for final closure.` 
      });
      setResolveModalComplaint(null);
      setResolveForm({
        resolutionDescription: '',
        workPerformed: '',
        resolvedBy: 'Ramesh Verma (Senior Electrician)',
        remarks: 'Tested and verified operational'
      });
      loadComplaints();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to resolve complaint' });
    }
  };

  // 4. Close Complaint (Mandatory Closure Reason & Validation)
  const handleCloseSubmit = async (e) => {
    e.preventDefault();
    if (!closeModalComplaint) return;
    if (!closeForm.closureReason.trim()) {
      showToast({ type: 'error', message: 'Closure Reason is strictly mandatory! Cannot close complaint with empty reason.' });
      return;
    }

    try {
      await closeComplaint(closeModalComplaint.id, {
        closureReason: closeForm.closureReason.trim(),
        closureCategory: closeForm.closureCategory,
        closedBy: closeForm.closedBy
      });
      showToast({ 
        type: 'success', 
        title: 'Complaint Closed', 
        message: `Ticket ${closeModalComplaint.complaintId} closed permanently with documented closure reason.` 
      });
      setCloseModalComplaint(null);
      setCloseForm({
        closureReason: '',
        closureCategory: 'RESOLVED_SATISFIED',
        closedBy: 'Society Admin'
      });
      loadComplaints();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to close complaint' });
    }
  };

  // 5. Reopen Complaint (Mandatory Reopen Reason & Re-enqueue)
  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenModalComplaint) return;
    if (!reopenForm.reopenedReason.trim()) {
      showToast({ type: 'error', message: 'Reopening Reason is strictly mandatory!' });
      return;
    }

    try {
      await reopenComplaint(reopenModalComplaint.id, {
        reopenedReason: reopenForm.reopenedReason.trim(),
        updatedPriority: reopenForm.updatedPriority,
        reopenedBy: reopenForm.reopenedBy
      });
      showToast({ 
        type: 'success', 
        title: 'Complaint Reopened', 
        message: `Ticket ${reopenModalComplaint.complaintId} reopened & re-enqueued into FIFO Queue and Min-Heap Priority Queue!` 
      });
      setReopenModalComplaint(null);
      setReopenForm({
        reopenedReason: '',
        updatedPriority: 'HIGH',
        reopenedBy: 'Resident'
      });
      loadComplaints();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.error || 'Failed to reopen complaint' });
    }
  };

  // 6. Automated FIFO Assign
  const handleFifoAssign = async () => {
    try {
      const res = await assignNextFifo('Ramesh Verma (Senior Electrician)');
      showToast({ 
        type: 'success', 
        title: 'FIFO Queue Dequeued', 
        message: `Oldest pending ticket ${res.data.complaintId} (Flat ${res.data.flatNumber}) dequeued and assigned to Ramesh Verma.` 
      });
      loadComplaints();
    } catch (err) {
      showToast({ type: 'info', title: 'FIFO Queue Empty', message: err.response?.data?.message || 'No pending complaints in FIFO Queue!' });
    }
  };

  // 7. Automated Priority Min-Heap Assign
  const handlePriorityAssign = async () => {
    try {
      const res = await assignNextPriority('Mukesh Solanki (Emergency Technician)');
      showToast({ 
        type: 'success', 
        title: 'Priority Min-Heap Polled', 
        message: `Extracted highest priority ticket ${res.data.complaintId} (${res.data.priority}) from Min-Heap and assigned to Mukesh Solanki.` 
      });
      loadComplaints();
    } catch (err) {
      showToast({ type: 'info', title: 'Priority Queue Empty', message: err.response?.data?.message || 'No pending complaints in Priority Queue!' });
    }
  };

  // 8. Re-prioritize in Min-Heap
  const handlePrioritySubmit = async (e) => {
    e.preventDefault();
    if (!priorityModalComplaint) return;
    try {
      await updateComplaintPriority(priorityModalComplaint.id, newPriority);
      showToast({ 
        type: 'success', 
        title: 'Min-Heap Re-prioritized', 
        message: `Ticket ${priorityModalComplaint.complaintId} re-indexed into Min-Heap with rank ${newPriority}.` 
      });
      setPriorityModalComplaint(null);
      loadComplaints();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to update priority' });
    }
  };

  // Filtering
  const filteredComplaints = complaints.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (c.complaintId && c.complaintId.toLowerCase().includes(q)) ||
             (c.residentName && c.residentName.toLowerCase().includes(q)) ||
             (c.flatNumber && c.flatNumber.toLowerCase().includes(q)) ||
             (c.title && c.title.toLowerCase().includes(q)) ||
             (c.description && c.description.toLowerCase().includes(q));
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ASSIGNED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'IN_PROGRESS':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'REOPENED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner: Dual Queue Automated Assignment Engines */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FIFO Queue Button Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900 block">Java ArrayDeque FIFO Queue</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-sky-100 text-sky-800 rounded">
                  {complaints.filter(c => c.status === 'SUBMITTED').length} In Queue
                </span>
              </div>
              <p className="text-[11px] text-slate-500">De-queues oldest submitted complaint in strict arrival sequence</p>
            </div>
          </div>
          <button
            onClick={handleFifoAssign}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            Assign Next (FIFO)
          </button>
        </div>

        {/* Priority Min-Heap Queue Button Card */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-900 block">Java PriorityQueue Min-Heap</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded">
                  {complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'REOPENED').length} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Pulls Critical &gt; High &gt; Medium with timestamp tie-breaker</p>
            </div>
          </div>
          <button
            onClick={handlePriorityAssign}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shrink-0 transition-colors shadow-xs cursor-pointer"
          >
            Assign Next (Priority)
          </button>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs text-xs">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets, residents, flats, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white"
          >
            <option value="ALL">All Statuses ({complaints.length})</option>
            <option value="SUBMITTED">Submitted ({complaints.filter(c => c.status === 'SUBMITTED').length})</option>
            <option value="ASSIGNED">Assigned ({complaints.filter(c => c.status === 'ASSIGNED').length})</option>
            <option value="IN_PROGRESS">In Progress ({complaints.filter(c => c.status === 'IN_PROGRESS').length})</option>
            <option value="RESOLVED">Resolved ({complaints.filter(c => c.status === 'RESOLVED').length})</option>
            <option value="CLOSED">Closed ({complaints.filter(c => c.status === 'CLOSED').length})</option>
            <option value="REOPENED">Reopened ({complaints.filter(c => c.status === 'REOPENED').length})</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical (Rank 1)</option>
            <option value="HIGH">High (Rank 2)</option>
            <option value="MEDIUM">Medium (Rank 3)</option>
            <option value="LOW">Low (Rank 4)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white"
          >
            <option value="ALL">All Categories</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICITY">Electricity</option>
            <option value="LIFT">Lift</option>
            <option value="CLEANING">Cleaning</option>
            <option value="SECURITY">Security</option>
            <option value="PARKING">Parking</option>
            <option value="WATER_SUPPLY">Water Supply</option>
            <option value="OTHER">Other</option>
          </select>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-1.5 rounded-lg transition-colors shadow-xs ml-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register Complaint
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Flat &amp; Resident</th>
                <th className="py-3 px-4">Category &amp; Title</th>
                <th className="py-3 px-4">Priority (Heap)</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4">Logged At</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No complaints matching current filters.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {c.complaintId}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block font-mono">Flat {c.flatNumber} ({c.building || 'A Wing'})</span>
                      <span className="text-slate-500 text-[11px] block">{c.residentName}</span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-700 mr-1.5">
                        {c.category}
                      </span>
                      <span className="font-medium text-slate-800">{c.title || c.description?.substring(0, 30)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => { setPriorityModalComplaint(c); setNewPriority(c.priority); }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer hover:opacity-85 ${getPriorityBadge(c.priority)}`}
                        title="Click to re-prioritize in Min-Heap"
                      >
                        {c.priority === 'CRITICAL' && <Flame className="w-3 h-3 text-rose-600" />}
                        {c.priority}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {c.assignedStaff ? (
                        <span className="font-medium text-slate-800 block text-[11px]">{c.assignedStaff}</span>
                      ) : (
                        <button
                          onClick={() => setAssignModalComplaint(c)}
                          className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" /> Assign Staff
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {c.submissionTime ? formatDateIndian(c.submissionTime) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Contextual Lifecycle Action Buttons */}
                        {c.status === 'SUBMITTED' && (
                          <button
                            onClick={() => setAssignModalComplaint(c)}
                            className="px-2 py-1 text-[11px] font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 transition-colors"
                          >
                            Assign
                          </button>
                        )}

                        {(c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS' || c.status === 'REOPENED') && (
                          <button
                            onClick={() => {
                              setResolveModalComplaint(c);
                              setResolveForm(prev => ({
                                ...prev,
                                resolvedBy: c.assignedStaff || 'Ramesh Verma (Senior Electrician)'
                              }));
                            }}
                            className="px-2 py-1 text-[11px] font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 transition-colors"
                          >
                            Resolve
                          </button>
                        )}

                        {c.status === 'RESOLVED' && (
                          <button
                            onClick={() => setCloseModalComplaint(c)}
                            className="px-2 py-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-white rounded transition-colors"
                          >
                            Close Ticket
                          </button>
                        )}

                        {c.status === 'CLOSED' && (
                          <button
                            onClick={() => setReopenModalComplaint(c)}
                            className="px-2 py-1 text-[11px] font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 transition-colors flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Reopen
                          </button>
                        )}

                        {/* Detail / Timeline View Button */}
                        <button
                          onClick={() => {
                            setDetailModalComplaint(c);
                            setDetailTab('timeline');
                          }}
                          className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="View Details & LinkedList Activity Timeline"
                        >
                          <GitBranch className="w-3 h-3 text-slate-500" /> Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}

      {/* 1. Register Complaint Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Register Society Service Complaint</h3>
                <p className="text-[11px] text-slate-500">Enqueues simultaneously into FIFO Queue &amp; Min-Heap Priority Queue</p>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Resident Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karan Patel"
                    value={registerForm.residentName}
                    onChange={(e) => setRegisterForm({ ...registerForm, residentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Flat Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-101"
                    value={registerForm.flatNumber}
                    onChange={(e) => setRegisterForm({ ...registerForm, flatNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Building / Wing *</label>
                  <select
                    value={registerForm.building}
                    onChange={(e) => setRegisterForm({ ...registerForm, building: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  >
                    <option value="A Wing">A Wing</option>
                    <option value="B Wing">B Wing</option>
                    <option value="C Wing">C Wing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Complaint Category *</label>
                  <select
                    value={registerForm.category}
                    onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  >
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICITY">Electricity</option>
                    <option value="LIFT">Lift</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="SECURITY">Security</option>
                    <option value="PARKING">Parking</option>
                    <option value="WATER_SUPPLY">Water Supply</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Complaint Subject / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Water leakage in bathroom pipeline"
                    value={registerForm.title}
                    onChange={(e) => setRegisterForm({ ...registerForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Priority Level *</label>
                  <select
                    value={registerForm.priority}
                    onChange={(e) => setRegisterForm({ ...registerForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  >
                    <option value="CRITICAL">Critical (Rank 1 - Immediate Intervention)</option>
                    <option value="HIGH">High (Rank 2)</option>
                    <option value="MEDIUM">Medium (Rank 3)</option>
                    <option value="LOW">Low (Rank 4)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">Detailed Description *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Describe the complaint in detail..."
                    value={registerForm.description}
                    onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  ></textarea>
                </div>
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
                  Enqueue Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Assign Staff Modal */}
      {assignModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Assign Maintenance Staff</h3>
                <p className="text-[11px] text-slate-500">Ticket {assignModalComplaint.complaintId} (Flat {assignModalComplaint.flatNumber})</p>
              </div>
              <button onClick={() => setAssignModalComplaint(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Technician / Staff Member *</label>
                <select
                  value={assignForm.staffName}
                  onChange={(e) => setAssignForm({ ...assignForm, staffName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                >
                  <option value="Ramesh Verma (Senior Electrician)">Ramesh Verma (Senior Electrician)</option>
                  <option value="Mukesh Solanki (Emergency Technician)">Mukesh Solanki (Emergency Technician)</option>
                  <option value="Pravin Rathod (Plumbing Lead)">Pravin Rathod (Plumbing Lead)</option>
                  <option value="Rajesh Sharma (Lift Engineer)">Rajesh Sharma (Lift Engineer)</option>
                  <option value="Kishore Parmar (Sanitation Supervisor)">Kishore Parmar (Sanitation Supervisor)</option>
                  <option value="Vanguard Security Services (Patrol Lead)">Vanguard Security Services (Patrol Lead)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Staff Contact Phone</label>
                <input
                  type="text"
                  value={assignForm.staffContact}
                  onChange={(e) => setAssignForm({ ...assignForm, staffContact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Assignment Instructions / Notes</label>
                <input
                  type="text"
                  value={assignForm.remarks}
                  onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalComplaint(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-xs"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Resolve Complaint Modal */}
      {resolveModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Resolve Complaint</h3>
                <p className="text-[11px] text-slate-500">Ticket {resolveModalComplaint.complaintId} • Flat {resolveModalComplaint.flatNumber}</p>
              </div>
              <button onClick={() => setResolveModalComplaint(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-700 block">Reported Issue:</span>
                <p className="text-slate-600 mt-0.5">{resolveModalComplaint.title || resolveModalComplaint.description}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Resolution Description * <span className="text-rose-500 font-normal">(Mandatory)</span>
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Cleared blocked drainage line and tightened coupling joints..."
                  value={resolveForm.resolutionDescription}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Work Performed Details * <span className="text-rose-500 font-normal">(Mandatory)</span>
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Replaced 1/2 inch PVC connector pipe, tested water pressure for 15 minutes."
                  value={resolveForm.workPerformed}
                  onChange={(e) => setResolveForm({ ...resolveForm, workPerformed: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Resolved By</label>
                  <input
                    type="text"
                    value={resolveForm.resolvedBy}
                    onChange={(e) => setResolveForm({ ...resolveForm, resolvedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Remarks</label>
                  <input
                    type="text"
                    value={resolveForm.remarks}
                    onChange={(e) => setResolveForm({ ...resolveForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolveModalComplaint(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs"
                >
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Close Complaint Modal (Mandatory Closure Reason & Business Rule Validation) */}
      {closeModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Close Service Complaint</h3>
                <p className="text-[11px] text-slate-500">Ticket {closeModalComplaint.complaintId} • Status: {closeModalComplaint.status}</p>
              </div>
              <button onClick={() => setCloseModalComplaint(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseSubmit} className="p-5 space-y-4 text-xs">
              {/* Business Rule Warning Alert */}
              {closeModalComplaint.status !== 'RESOLVED' && 
               closeForm.closureCategory !== 'DUPLICATE_MERGED' && 
               closeForm.closureCategory !== 'WITHDRAWN_BY_RESIDENT' && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-800">
                    <strong>Business Rule Warning:</strong> This complaint is currently in <code>{closeModalComplaint.status}</code> status. 
                    It must either be marked as <code>RESOLVED</code> first, or you must select an administrative closure category (Duplicate or Withdrawn).
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">Closure Category *</label>
                <select
                  value={closeForm.closureCategory}
                  onChange={(e) => setCloseForm({ ...closeForm, closureCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                >
                  <option value="RESOLVED_SATISFIED">Standard: Resolved &amp; Verified Satisfactory</option>
                  <option value="DUPLICATE_MERGED">Administrative: Duplicate Ticket Merged</option>
                  <option value="WITHDRAWN_BY_RESIDENT">Administrative: Withdrawn by Resident</option>
                  <option value="OTHER">Other Administrative Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Mandatory Closure Reason * <span className="text-rose-500 font-normal">(Cannot be empty)</span>
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="State the permanent closure justification (e.g. Resident inspected and signed off satisfaction chit)..."
                  value={closeForm.closureReason}
                  onChange={(e) => setCloseForm({ ...closeForm, closureReason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                ></textarea>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Permanently stored in database record and audit trail.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Closed By</label>
                <input
                  type="text"
                  value={closeForm.closedBy}
                  onChange={(e) => setCloseForm({ ...closeForm, closedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCloseModalComplaint(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shadow-xs"
                >
                  Permanently Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Reopen Complaint Modal */}
      {reopenModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Reopen Closed / Resolved Complaint</h3>
                <p className="text-[11px] text-slate-500">Ticket {reopenModalComplaint.complaintId} • Preserves history &amp; re-enqueues</p>
              </div>
              <button onClick={() => setReopenModalComplaint(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReopenSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-rose-50/70 rounded-lg border border-rose-200 text-rose-900">
                <p className="font-semibold">Reopening Policy:</p>
                <p className="text-[11px] mt-0.5">
                  This action preserves all prior timeline activities and re-enqueues the ticket directly into the <strong>FIFO Queue</strong> and <strong>Priority Min-Heap</strong>.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Mandatory Reopening Reason * <span className="text-rose-500 font-normal">(Cannot be empty)</span>
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Explain why issue was not fully resolved (e.g. Water leak re-emerged after 2 days)..."
                  value={reopenForm.reopenedReason}
                  onChange={(e) => setReopenForm({ ...reopenForm, reopenedReason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Re-prioritize in Heap</label>
                  <select
                    value={reopenForm.updatedPriority}
                    onChange={(e) => setReopenForm({ ...reopenForm, updatedPriority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  >
                    <option value="CRITICAL">Critical (Escalate to Rank 1)</option>
                    <option value="HIGH">High (Rank 2)</option>
                    <option value="MEDIUM">Medium (Rank 3)</option>
                    <option value="LOW">Low (Rank 4)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Reopened By</label>
                  <input
                    type="text"
                    value={reopenForm.reopenedBy}
                    onChange={(e) => setReopenForm({ ...reopenForm, reopenedBy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReopenModalComplaint(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium shadow-xs"
                >
                  Reopen &amp; Re-enqueue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Priority Min-Heap Re-rank Modal */}
      {priorityModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Re-rank Priority in Min-Heap</h3>
                <p className="text-[11px] text-slate-500">Safe remove and re-insertion into Java PriorityQueue</p>
              </div>
              <button onClick={() => setPriorityModalComplaint(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePrioritySubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-xs"
                >
                  <option value="CRITICAL">Critical (Rank 1 - Emergency)</option>
                  <option value="HIGH">High (Rank 2)</option>
                  <option value="MEDIUM">Medium (Rank 3)</option>
                  <option value="LOW">Low (Rank 4)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setPriorityModalComplaint(null)} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium shadow-xs">Re-insert in Heap</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Comprehensive Complaint Detail & LinkedList Activity Timeline Modal */}
      {detailModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Ticket {detailModalComplaint.complaintId}
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(detailModalComplaint.status)}`}>
                    {detailModalComplaint.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(detailModalComplaint.priority)}`}>
                    {detailModalComplaint.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Flat {detailModalComplaint.flatNumber} ({detailModalComplaint.building || 'A Wing'}) • {detailModalComplaint.residentName}
                </p>
              </div>
              <button onClick={() => setDetailModalComplaint(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-4 px-6 border-b border-slate-200 text-xs font-semibold shrink-0 bg-white">
              <button
                onClick={() => setDetailTab('timeline')}
                className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  detailTab === 'timeline'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                LinkedList Activity Timeline ({detailModalComplaint.activityHistory?.length || 0})
              </button>
              <button
                onClick={() => setDetailTab('details')}
                className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                  detailTab === 'details'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Complaint Details
              </button>
              {(detailModalComplaint.resolutionDescription || detailModalComplaint.status === 'RESOLVED' || detailModalComplaint.status === 'CLOSED') && (
                <button
                  onClick={() => setDetailTab('resolution')}
                  className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                    detailTab === 'resolution'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Resolution Info
                </button>
              )}
              {detailModalComplaint.closureReason && (
                <button
                  onClick={() => setDetailTab('closure')}
                  className={`py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
                    detailTab === 'closure'
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  Closure Justification
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 text-xs space-y-4 overflow-y-auto flex-1">
              {/* Tab 1: Chronological LinkedList Activity Timeline */}
              {detailTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-900 block">Java LinkedList Chronological History</span>
                      <p className="text-[11px] text-slate-500">Traversed from Java LinkedList in strict chronological sequence</p>
                    </div>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500">
                      O(1) Appends
                    </span>
                  </div>

                  {/* Nodes */}
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {(detailModalComplaint.activityHistory || []).map((act, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white"></span>
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{act.action}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatDateTimeIndian(act.timestamp)}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">{act.remarks || 'No additional remarks'}</p>
                          <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-2">
                            <span>Actor: <strong>{act.performedBy}</strong></span>
                            {act.previousStatus && (
                              <span>Transition: <code>{act.previousStatus} → {act.newStatus}</code></span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Complaint Overview */}
              {detailTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Resident Name</span>
                      <strong className="text-slate-800 text-sm">{detailModalComplaint.residentName}</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Flat &amp; Wing</span>
                      <strong className="text-slate-800 font-mono text-sm">Flat {detailModalComplaint.flatNumber} ({detailModalComplaint.building})</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Category</span>
                      <span className="font-semibold text-slate-800">{detailModalComplaint.category}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Priority Level</span>
                      <span className="font-semibold text-slate-800">{detailModalComplaint.priority}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Logged Time</span>
                      <span className="font-mono text-slate-700">{formatDateTimeIndian(detailModalComplaint.submissionTime)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block uppercase">Assigned Staff</span>
                      <span className="font-semibold text-slate-800">{detailModalComplaint.assignedStaff || 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border border-slate-200">
                    <span className="text-[11px] text-slate-400 block uppercase mb-1">Issue Title</span>
                    <p className="font-semibold text-slate-900 text-sm">{detailModalComplaint.title || 'Untitled Complaint'}</p>
                    <span className="text-[11px] text-slate-400 block uppercase mt-3 mb-1">Detailed Description</span>
                    <p className="text-slate-700 leading-relaxed">{detailModalComplaint.description}</p>
                  </div>
                </div>
              )}

              {/* Tab 3: Resolution Details */}
              {detailTab === 'resolution' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-emerald-900">Official Resolution Record</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {formatDateTimeIndian(detailModalComplaint.resolvedTime)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-emerald-800 font-semibold uppercase block">Resolution Description</span>
                      <p className="text-slate-800 mt-1">{detailModalComplaint.resolutionDescription || 'No description provided'}</p>
                    </div>

                    <div>
                      <span className="text-[11px] text-emerald-800 font-semibold uppercase block">Work Performed by Technician</span>
                      <p className="text-slate-800 mt-1">{detailModalComplaint.workPerformed || 'Standard maintenance performed'}</p>
                    </div>

                    <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Resolved By: <strong>{detailModalComplaint.resolvedBy || detailModalComplaint.assignedStaff}</strong></span>
                      <span className="text-emerald-700 font-semibold">STATUS: RESOLVED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Closure Justification */}
              {detailTab === 'closure' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-300 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-700" />
                        <span className="font-bold text-slate-900">Mandatory Closure Audit Record</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {formatDateTimeIndian(detailModalComplaint.closedTime)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold uppercase block">Mandatory Closure Reason</span>
                      <p className="text-slate-900 font-medium mt-1 p-3 bg-white rounded border border-slate-200 text-xs">
                        "{detailModalComplaint.closureReason}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-400 block uppercase">Closure Category</span>
                        <span className="font-semibold text-slate-800 font-mono">{detailModalComplaint.closureCategory || 'RESOLVED_SATISFIED'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase">Authorized Closer</span>
                        <span className="font-semibold text-slate-800">{detailModalComplaint.closedBy || 'Admin'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <span className="text-[11px] text-slate-400">Green Valley Residency • Complaint Desk</span>
              <button
                onClick={() => setDetailModalComplaint(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium text-xs transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
