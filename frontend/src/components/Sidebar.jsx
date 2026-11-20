import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  AlertCircle, 
  UserCheck, 
  CreditCard, 
  Bell, 
  Settings, 
  LogOut,
  Building2,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, isCollapsed, setIsCollapsed, undoStackCount }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'residents', label: 'Residents', icon: Users, badge: 'AVL' },
    { id: 'maintenance', label: 'Maintenance', icon: Receipt, badge: 'BST' },
    { id: 'complaints', label: 'Complaints', icon: AlertCircle, badge: 'Queue' },
    { id: 'visitors', label: 'Visitors', icon: UserCheck },
    { id: 'expenses', label: 'Expenses', icon: CreditCard, badge: 'ArrayList' },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-white tracking-tight text-base leading-tight">
                BuildWise
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Society ERP & DS Engine
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400 font-semibold border border-emerald-500/30'
                  : 'hover:bg-slate-800/60 hover:text-white text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-colors ${
                isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
              
              {!isCollapsed && (
                <div className="flex items-center justify-between w-full">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                      item.highlight 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Tooltip on collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-800 text-slate-100 text-xs rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>


      {/* Footer / User Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white shrink-0">
              AD
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left truncate">
                <span className="text-xs font-medium text-slate-200 truncate">Society Admin</span>
                <span className="text-[10px] text-slate-500 truncate">admin@buildwise.com</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              if (window.confirm('Log out from BuildWise Management Portal?')) {
                setCurrentPage('dashboard');
              }
            }}
            title="Logout"
            className="text-slate-500 hover:text-rose-400 p-1.5 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
