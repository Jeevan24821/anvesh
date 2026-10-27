import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
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
  const { t } = useLanguage();
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
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F3F5F8] text-[#172033]">
        <div className="w-12 h-12 border-4 border-[#0645A8] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-[#0645A8]">
          <Shield className="w-5 h-5 text-[#0645A8]" />
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
    <div className="flex h-screen bg-[#F3F5F8] text-[#172033] overflow-hidden">
      {/* Blue Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F3F5F8]">
        {/* Top Header */}
        <Header 
          onNavigate={handleNavigate} 
          activePage={activePage} 
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Read-Only Notice Bar if in Viewer Mode */}
        {currentRole?.readOnly && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-900 flex items-center justify-between font-medium animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Read-Only Audit Mode:</strong> {t('audit_mode_notice')}
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
              {t('audit_scrutiny_view')}
            </span>
          </div>
        )}

        {/* Page Content Scrollable Container */}
        <main className="flex-1 overflow-y-auto bg-[#F3F5F8] animate-fade-in">
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
                initialFilter={complaintFilters}
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
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
