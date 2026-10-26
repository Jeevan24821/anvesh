import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Complaints } from './pages/Complaints';
import { CaseDetails } from './pages/CaseDetails';
import { Institutions } from './pages/Institutions';
import { Overlaps } from './pages/Overlaps';
import { Reports } from './pages/Reports';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AlertCircle, Shield } from 'lucide-react';

function AppContent() {
  const { currentRole, isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [complaintFilters, setComplaintFilters] = useState({});

  // Route protection: Complainants cannot access inter-bureau overlap intelligence, reports, or institution directory
  useEffect(() => {
    if (currentRole?.role === 'Complainant') {
      if (activePage === 'overlaps' || activePage === 'reports' || activePage === 'institutions') {
        setActivePage('dashboard');
      }
    }
  }, [currentRole, activePage]);

  // If waiting for token verification on launch
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-blue-400">
          <Shield className="w-5 h-5 text-blue-400" />
          <span>Verifying Secure ANVESH Session...</span>
        </div>
      </div>
    );
  }

  // FIRST SCREEN: If unauthenticated, show professional LoginPage
  if (!isAuthenticated || !currentRole) {
    return <LoginPage />;
  }

  const handleNavigate = (page, filters = {}) => {
    if (currentRole?.role === 'Complainant' && (page === 'institutions' || page === 'overlaps' || page === 'reports')) {
      setActivePage('dashboard');
      return;
    }
    setActivePage(page);
    setComplaintFilters(filters);
    if (page !== 'case_details') {
      setActiveCaseId(null);
    }
  };

  const handleViewCase = (id) => {
    setActiveCaseId(id);
    setActivePage('case_details');
  };

  const handleViewInstitution = (instId) => {
    if (currentRole?.role === 'Complainant') {
      return;
    }
    setActivePage('institutions');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onNavigate={handleNavigate} activePage={activePage} />

        {/* Read-Only Notice Bar if in Viewer Mode */}
        {currentRole?.readOnly && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Read-Only Audit Mode:</strong> Logged in as External Ministry Scrutiny Auditor. All administrative actions and state transitions are disabled.
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">
              Audit Scrutiny View
            </span>
          </div>
        )}

        {/* Page Content Scrollable Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <ErrorBoundary>
            {activePage === 'dashboard' && (
              <Dashboard
                onNavigate={handleNavigate}
                onViewCase={handleViewCase}
                onViewInstitution={handleViewInstitution}
              />
            )}

            {activePage === 'complaints' && (
              <Complaints
                onViewCase={handleViewCase}
                onViewInstitution={handleViewInstitution}
                initialFilter={complaintFilters}
              />
            )}

            {activePage === 'case_details' && (
              <CaseDetails
                caseId={activeCaseId}
                onBack={() => setActivePage('complaints')}
                onViewCase={handleViewCase}
                onViewInstitution={handleViewInstitution}
              />
            )}

            {activePage === 'institutions' && currentRole?.role !== 'Complainant' && (
              <Institutions onViewCase={handleViewCase} />
            )}

            {activePage === 'overlaps' && (
              <Overlaps onViewCase={handleViewCase} />
            )}

            {activePage === 'reports' && (
              <Reports />
            )}

            {activePage === 'notifications' && (
              <Notifications
                onViewCase={handleViewCase}
                onViewOverlap={() => setActivePage('overlaps')}
              />
            )}

            {activePage === 'settings' && (
              <Settings />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
