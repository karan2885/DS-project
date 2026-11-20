import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  RotateCcw, 
  Calendar,
  ChevronDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function Navbar({ 
  currentPage, 
  isCollapsed, 
  setIsCollapsed, 
  onGlobalSearch, 
  onTriggerUndo, 
  undoStackCount,
  isUndoing
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const getPageTitle = (page) => {
    switch (page) {
      case 'dashboard': return { title: 'Dashboard Overview', desc: 'Central residential operations and KPIs' };
      case 'residents': return { title: 'Resident Directory', desc: 'Manage occupants and flat assignments (AVL Tree Indexed)' };
      case 'maintenance': return { title: 'Maintenance Collections', desc: 'Resident dues, receipts, and reports (BST Partitioned)' };
      case 'complaints': return { title: 'Complaint Desk', desc: 'Service tickets & resolution pipelines (FIFO Queue & Min-Heap)' };
      case 'visitors': return { title: 'Visitor Log', desc: 'Gate entry validation and visitor checkouts' };
      case 'expenses': return { title: 'Society Expenses', desc: 'Expenditure tracking and ledger (ArrayList Collections)' };
      case 'notices': return { title: 'Notice Board', desc: 'Society circulars, emergency announcements, and AGM updates' };
      case 'monitor': return { title: 'Data Structure Monitor', desc: 'Real-time Java Data Structures inspection and academic demonstration' };
      case 'settings': return { title: 'System Settings', desc: 'Society parameters, maintenance dues configuration, and sync' };
      default: return { title: 'BuildWise Management', desc: 'Residential Property System' };
    }
  };

  const pageInfo = getPageTitle(currentPage);
  const todayFormatted = new Intl.DateTimeFormat('en-IN', { 
    weekday: 'short', 
    day: 'numeric',
    month: 'short', 
    year: 'numeric' 
  }).format(new Date());

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Hamburger + Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-slate-900 leading-tight">
            {pageInfo.title}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {pageInfo.desc}
          </p>
        </div>
      </div>

      {/* Right: Search, Date, Undo Button, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Global Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search residents, flats, complaints..."
            onChange={(e) => onGlobalSearch && onGlobalSearch(e.target.value)}
            className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white w-64 transition-all"
          />
        </div>

        {/* Current Date */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>


        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">System Alerts</span>
                <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">Live</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                <div className="p-3 hover:bg-slate-50 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">Critical Complaint Logged</p>
                    <p className="text-slate-500 text-[11px]">Flat A-201 reported electrical panel sparks. Min-heap rank 1.</p>
                  </div>
                </div>
                <div className="p-3 hover:bg-slate-50 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800">Maintenance Synchronized</p>
                    <p className="text-slate-500 text-[11px]">BST rebuild completed for 65 historical records.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
              AD
            </div>
            <span className="text-xs font-medium text-slate-700 hidden sm:block">Admin</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="font-medium text-slate-800">Green Valley Administrator</p>
                <p className="text-slate-400 text-[11px]">admin@greenvalley.in</p>
              </div>
              <button 
                onClick={() => { setShowProfile(false); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-600"
              >
                Profile & Access Roles
              </button>
              <button 
                onClick={() => { setShowProfile(false); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-600"
              >
                Audit Trails
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
