import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Toast from './components/Toast';

import DashboardPage from './pages/DashboardPage';
import ResidentsPage from './pages/ResidentsPage';
import MaintenancePage from './pages/MaintenancePage';
import ComplaintsPage from './pages/ComplaintsPage';
import VisitorsPage from './pages/VisitorsPage';
import ExpensesPage from './pages/ExpensesPage';
import NoticesPage from './pages/NoticesPage';
import DataStructureMonitorPage from './pages/DataStructureMonitorPage';
import SettingsPage from './pages/SettingsPage';

import { getStackStats, undoLastAction } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [toast, setToast] = useState(null);
  const [undoStackCount, setUndoStackCount] = useState(0);
  const [isUndoing, setIsUndoing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchUndoStackStatus();
  }, [refreshTrigger, currentPage]);

  const fetchUndoStackStatus = async () => {
    try {
      const res = await getStackStats();
      setUndoStackCount(res.data?.size || 0);
    } catch (err) {
      console.error('Error reading undo stack status', err);
    }
  };

  const showToast = (toastObj) => {
    setToast(toastObj);
  };

  const handleTriggerUndo = async () => {
    if (undoStackCount === 0 || isUndoing) return;
    try {
      setIsUndoing(true);
      const res = await undoLastAction();
      if (res.data.success) {
        showToast({
          type: 'success',
          title: 'Operation Rolled Back',
          message: res.data.message
        });
        setRefreshTrigger(prev => prev + 1);
        fetchUndoStackStatus();
      } else {
        showToast({
          type: 'info',
          title: 'Stack Empty',
          message: res.data.message
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Undo Failed',
        message: 'Could not rollback last operation'
      });
    } finally {
      setIsUndoing(false);
    }
  };

  const handleGlobalSearch = (query) => {
    if (!query) return;
    // Route to appropriate view if search hints
    if (query.toUpperCase().startsWith('A-') || query.toUpperCase().startsWith('B-')) {
      setCurrentPage('residents');
    } else if (query.toUpperCase().startsWith('CMP-')) {
      setCurrentPage('complaints');
    } else if (query.toUpperCase().startsWith('MNT-')) {
      setCurrentPage('maintenance');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        undoStackCount={undoStackCount}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
        isCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Top Navbar */}
        <Navbar 
          currentPage={currentPage}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onGlobalSearch={handleGlobalSearch}
          onTriggerUndo={handleTriggerUndo}
          undoStackCount={undoStackCount}
          isUndoing={isUndoing}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && (
            <DashboardPage 
              setCurrentPage={setCurrentPage} 
              showToast={showToast} 
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentPage === 'residents' && (
            <ResidentsPage 
              showToast={showToast} 
              onTriggerUndo={handleTriggerUndo} 
            />
          )}

          {currentPage === 'maintenance' && (
            <MaintenancePage 
              showToast={showToast} 
            />
          )}

          {currentPage === 'complaints' && (
            <ComplaintsPage 
              showToast={showToast} 
            />
          )}

          {currentPage === 'visitors' && (
            <VisitorsPage 
              showToast={showToast} 
            />
          )}

          {currentPage === 'expenses' && (
            <ExpensesPage 
              showToast={showToast} 
            />
          )}

          {currentPage === 'notices' && (
            <NoticesPage 
              showToast={showToast} 
            />
          )}

          {currentPage === 'monitor' && (
            <DataStructureMonitorPage 
              showToast={showToast} 
              onTriggerUndo={handleTriggerUndo} 
            />
          )}

          {currentPage === 'settings' && (
            <SettingsPage 
              showToast={showToast} 
            />
          )}
        </main>
      </div>

      {/* Toast Alert Popups */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
