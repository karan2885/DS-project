import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Pin, 
  Trash2, 
  Edit2, 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  Wrench, 
  Users, 
  X,
  FileText
} from 'lucide-react';
import { getNotices, createNotice, updateNotice, deleteNotice } from '../services/api';

export default function NoticesPage({ showToast }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedNotice, setSelectedNotice] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    pinned: false,
    author: 'Management Committee',
    publicationDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const res = await getNotices();
      setNotices(res.data || []);
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to load notices' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, notice = null) => {
    setModalMode(mode);
    setSelectedNotice(notice);
    if (notice) {
      setFormData({
        title: notice.title || '',
        description: notice.description || '',
        category: notice.category || 'GENERAL',
        pinned: notice.pinned || false,
        author: notice.author || 'Management Committee',
        publicationDate: notice.publicationDate || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'GENERAL',
        pinned: false,
        author: 'Management Committee',
        publicationDate: new Date().toISOString().split('T')[0]
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await createNotice(formData);
        showToast({ type: 'success', title: 'Notice Published', message: `Notice "${formData.title}" published.` });
      } else {
        await updateNotice(selectedNotice.id, formData);
        showToast({ type: 'success', title: 'Notice Updated', message: `Notice "${formData.title}" updated.` });
      }
      setIsModalOpen(false);
      loadNotices();
    } catch (err) {
      showToast({ type: 'error', message: 'Failed to save notice' });
    }
  };

  const handleDelete = async (notice) => {
    if (window.confirm(`Delete notice "${notice.title}"? This action will be pushed to the Undo Stack.`)) {
      try {
        await deleteNotice(notice.id);
        showToast({ 
          type: 'success', 
          title: 'Notice Deleted', 
          message: `Notice "${notice.title}" removed. Pushed to Undo Stack.` 
        });
        loadNotices();
      } catch (err) {
        showToast({ type: 'error', message: 'Failed to delete notice' });
      }
    }
  };

  const pinnedNotices = notices.filter(n => n.pinned);
  const regularNotices = notices.filter(n => !n.pinned);

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'EMERGENCY':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-600" /> Emergency</span>;
      case 'MAINTENANCE':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"><Wrench className="w-3 h-3 text-amber-600" /> Maintenance</span>;
      case 'SECURITY':
        return <span className="bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-sky-600" /> Security</span>;
      case 'EVENT':
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1"><Users className="w-3 h-3 text-indigo-600" /> Society Event</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">General Circular</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Official Society Notice Board</h2>
          <p className="text-xs text-slate-500">Circulars, general body resolutions, and critical operational updates</p>
        </div>

        <button
          onClick={() => handleOpenModal('create')}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Publish Notice
        </button>
      </div>

      {/* Pinned Section */}
      {pinnedNotices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
            <Pin className="w-4 h-4 text-amber-600" />
            <span>Pinned Announcements</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinnedNotices.map((n) => (
              <div 
                key={n.id} 
                className="bg-amber-50/40 p-4 rounded-lg border border-amber-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {getCategoryBadge(n.category)}
                    <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {n.publicationDate}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{n.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{n.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Issued by: <strong>{n.author}</strong></span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal('edit', n)}
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                      title="Edit Notice"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(n)}
                      className="p-1 text-slate-500 hover:text-rose-600 rounded"
                      title="Delete Notice (Undo supported)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Notices Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Notices</h3>

        {loading ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-lg border border-slate-200">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : regularNotices.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white rounded-lg border border-slate-200 text-xs">
            No standard notices to display.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularNotices.map((n) => (
              <div 
                key={n.id} 
                className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {getCategoryBadge(n.category)}
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {n.publicationDate}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1.5">{n.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{n.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] truncate max-w-[150px]">By {n.author}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenModal('edit', n)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(n)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {modalMode === 'create' ? 'Publish Society Notice' : 'Edit Notice'}
                </h3>
                <p className="text-[11px] text-slate-500">Broadcast updates to society members</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Notice Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water Tank Cleaning Schedule"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-xs"
                  >
                    <option value="GENERAL">General Circular</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="SECURITY">Security</option>
                    <option value="EMERGENCY">Emergency Alert</option>
                    <option value="EVENT">Society Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Publication Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.publicationDate}
                    onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Notice Content / Description *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Enter complete notice details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-xs"
                ></textarea>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="font-medium text-slate-800 block">Pin to Dashboard</span>
                  <span className="text-[11px] text-slate-500">Highlights announcement at top of notice board</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
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
                  {modalMode === 'create' ? 'Publish Circular' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
