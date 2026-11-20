import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  Check, 
  ArrowUpDown,
  Building,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  getResidents, 
  createResident, 
  updateResident, 
  deleteResident,
  searchAvl,
  undoLastAction
} from '../services/api';

export default function ResidentsPage({ showToast, onTriggerUndo }) {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedResident, setSelectedResident] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    flatNumber: '',
    building: 'A Wing',
    contactNumber: '',
    email: '',
    occupancyStatus: 'OWNER',
    moveInDate: ''
  });

  // Fast AVL Tree Verification Result
  const [avlVerification, setAvlVerification] = useState(null);
  const [verifyingAvl, setVerifyingAvl] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    loadResidents();
  }, [searchQuery, buildingFilter, statusFilter]);

  const loadResidents = async () => {
    try {
      setLoading(true);
      const res = await getResidents({
        search: searchQuery,
        building: buildingFilter,
        occupancyStatus: statusFilter
      });
      setResidents(res.data || []);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to load residents' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, resident = null) => {
    setModalMode(mode);
    setSelectedResident(resident);
    setAvlVerification(null);
    if (resident) {
      setFormData({
        name: resident.name || '',
        flatNumber: resident.flatNumber || '',
        building: resident.building || 'A Wing',
        contactNumber: resident.contactNumber || '',
        email: resident.email || '',
        occupancyStatus: resident.occupancyStatus || 'OWNER',
        moveInDate: resident.moveInDate || ''
      });
      if (mode === 'view') {
        verifyAvlPresence(resident.flatNumber);
      }
    } else {
      setFormData({
        name: '',
        flatNumber: '',
        building: 'A Wing',
        contactNumber: '',
        email: '',
        occupancyStatus: 'OWNER',
        moveInDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const verifyAvlPresence = async (flatNumber) => {
    try {
      setVerifyingAvl(true);
      const res = await searchAvl(flatNumber);
      setAvlVerification(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingAvl(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await createResident(formData);
        showToast({ type: 'success', title: 'Resident Added', message: `${formData.name} added and indexed into AVL Tree.` });
      } else if (modalMode === 'edit') {
        await updateResident(selectedResident.id, formData);
        showToast({ type: 'success', title: 'Resident Updated', message: `Status updated. Previous state pushed to Undo Stack.` });
      }
      setIsModalOpen(false);
      loadResidents();
    } catch (err) {
      showToast({ type: 'error', message: err.response?.data?.message || 'Operation failed' });
    }
  };

  const handleDelete = async (resident) => {
    if (window.confirm(`Are you sure you want to deactivate resident ${resident.name} (${resident.flatNumber})? You can undo this action.`)) {
      try {
        await deleteResident(resident.id);
        showToast({ 
          type: 'success', 
          title: 'Resident Deactivated', 
          message: `${resident.name} removed from AVL Tree. Operation pushed to Undo Stack.` 
        });
        loadResidents();
      } catch (err) {
        showToast({ type: 'error', message: 'Failed to deactivate resident' });
      }
    }
  };

  // Pagination slicing
  const totalPages = Math.ceil(residents.length / pageSize) || 1;
  const paginatedResidents = residents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by resident name, flat number, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white transition-all"
          />
        </div>

        {/* Filters & Add Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Building:</span>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Wings</option>
              <option value="A Wing">A Wing</option>
              <option value="B Wing">B Wing</option>
              <option value="C Wing">C Wing</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OWNER">Owner</option>
              <option value="TENANT">Tenant</option>
              <option value="VACANT">Vacant</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenModal('create')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors shadow-xs ml-auto"
          >
            <Plus className="w-4 h-4" /> Add Resident
          </button>
        </div>
      </div>

      {/* Residents Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-3 px-4">Flat No.</th>
                <th className="py-3 px-4">Resident Name</th>
                <th className="py-3 px-4">Building</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Occupancy Status</th>
                <th className="py-3 px-4">Move-in Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </td>
                </tr>
              ) : paginatedResidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No residents found matching criteria.
                  </td>
                </tr>
              ) : (
                paginatedResidents.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {r.flatNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {r.name}
                      <span className="block text-[10px] text-slate-400 font-mono font-normal">
                        {r.residentId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {r.building}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-800 block">{r.contactNumber || '—'}</span>
                      <span className="text-slate-400 text-[11px] block">{r.email || '—'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                        r.occupancyStatus === 'OWNER' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : r.occupancyStatus === 'TENANT'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {r.occupancyStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {r.moveInDate || '—'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal('view', r)}
                        title="View Profile & AVL Index"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenModal('edit', r)}
                        title="Edit Details"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        title="Deactivate Resident"
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {residents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, residents.length)} of {residents.length} residents
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Previous
            </button>
            <span className="px-2 font-mono">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit / View Resident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {modalMode === 'create' && 'Add New Resident (AVL Indexing)'}
                  {modalMode === 'edit' && `Edit Resident - ${selectedResident?.name}`}
                  {modalMode === 'view' && `Resident Profile - ${selectedResident?.name}`}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {modalMode === 'create' && 'Record resident and automatically balance tree.'}
                  {modalMode === 'edit' && 'Changes are saved to MongoDB and logged to Undo Stack.'}
                  {modalMode === 'view' && 'Flat key details and AVL Tree search path verification.'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            {modalMode === 'view' ? (
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Resident Name</span>
                    <strong className="text-slate-900 text-sm">{selectedResident?.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Flat / AVL Key</span>
                    <strong className="text-emerald-700 font-mono text-sm">{selectedResident?.flatNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Building</span>
                    <span className="text-slate-800">{selectedResident?.building}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Occupancy Status</span>
                    <span className="text-slate-800 font-semibold">{selectedResident?.occupancyStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                    <span className="text-slate-800">{selectedResident?.contactNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <span className="text-slate-800">{selectedResident?.email}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 block text-[11px]">Move-in Date</span>
                    <span className="text-slate-800 font-mono">{selectedResident?.moveInDate}</span>
                  </div>
                </div>

                {/* AVL Search Path Trace Demonstration */}
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-900">AVL Tree Search Verification</span>
                  </div>
                  {verifyingAvl ? (
                    <p className="text-slate-500">Traversing AVL Tree...</p>
                  ) : avlVerification ? (
                    <div className="space-y-1 text-[11px] text-emerald-800">
                      <p><strong>Found:</strong> {avlVerification.found ? 'Yes (O(log N))' : 'No'}</p>
                      <p><strong>Binary Comparisons (Steps):</strong> {avlVerification.steps}</p>
                      <p><strong>Search Path:</strong> {avlVerification.path?.join(' ➔ ')}</p>
                    </div>
                  ) : (
                    <p className="text-slate-500">Node verified in AVL tree memory.</p>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-700 font-medium mb-1">Full Resident Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Flat Number (AVL Key) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. A-101"
                      disabled={modalMode === 'edit'}
                      value={formData.flatNumber}
                      onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white font-mono disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Building / Block *</label>
                    <select
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                    >
                      <option value="A Wing">A Wing</option>
                      <option value="B Wing">B Wing</option>
                      <option value="C Wing">C Wing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 98250 12345"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="resident@buildwise.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Occupancy Status *</label>
                    <select
                      value={formData.occupancyStatus}
                      onChange={(e) => setFormData({ ...formData, occupancyStatus: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                    >
                      <option value="OWNER">Owner</option>
                      <option value="TENANT">Tenant</option>
                      <option value="VACANT">Vacant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Move-In Date</label>
                    <input
                      type="date"
                      value={formData.moveInDate}
                      onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-xs"
                  >
                    {modalMode === 'create' ? 'Save & Balance Tree' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
