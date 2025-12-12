
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SearchResults } from './components/SearchResults';
import { CaseDetail } from './components/CaseDetail';
import { AdminPanel } from './components/AdminPanel';
import { Resources } from './components/Resources';
import { TeamDashboard } from './components/TeamDashboard'; 
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { NotificationsModal } from './components/NotificationsModal';
import { SupportModal } from './components/SupportModal';
import { SaveCaseModal } from './components/SaveCaseModal'; 
import { MultiAnalysisView } from './components/MultiAnalysisView'; 
import { LegalCase, ViewState, User, Announcement } from './types';
import { searchCases, getAnnouncements, toggleSavedCase, getCases, getUsers, addCaseToFolder, getCaseById, initDatabase } from './services/db';
import { getCurrentUser, logout, checkSubscription } from './services/auth';
import { AnalysisMode } from './services/geminiService';
import { LanguageProvider } from './contexts/LanguageContext';
import { Scale } from 'lucide-react';

const AppContent: React.FC = () => {
  // DB Ready State
  const [isDbReady, setIsDbReady] = useState(false);

  // Navigation History Stack
  const [viewStack, setViewStack] = useState<ViewState[]>(['HOME']);
  const view = viewStack[viewStack.length - 1]; // Current active view

  const [user, setUser] = useState<User | null>(null);
  
  // Modals
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  
  // Save Modal State
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [caseToSaveId, setCaseToSaveId] = useState<string | null>(null);

  // Data State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [filteredCases, setFilteredCases] = useState<LegalCase[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);

  // Multi-Analysis State
  const [analysisCases, setAnalysisCases] = useState<LegalCase[]>([]);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('POINTS');

  // INITIALIZE DATABASE
  useEffect(() => {
      initDatabase().then(() => {
          setIsDbReady(true);
          // Initial load of cases after DB is ready
          setFilteredCases(searchCases(''));
      });
  }, []);

  // Init Session
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Validate subscription on load
      const subStatus = checkSubscription(currentUser);
      if (!subStatus.valid) {
        setShowSubscription(true);
      }
    }
  }, []);

  // Poll for announcements
  useEffect(() => {
    if (!isDbReady) return;
    
    const checkAnnouncements = () => {
       const list = getAnnouncements();
       setAnnouncements(list);
       
       const lastViewedId = localStorage.getItem('myanlex_last_viewed_announcement');
       if (list.length > 0 && list[0].id !== lastViewedId) {
         setHasNewAnnouncements(true);
       } else {
         setHasNewAnnouncements(false);
       }
    };
    
    checkAnnouncements();
    const interval = setInterval(checkAnnouncements, 10000); 
    return () => clearInterval(interval);
  }, [isDbReady]);

  const handleNotificationsOpen = () => {
    if (showNotifications) {
      setShowNotifications(false);
    } else {
      setShowNotifications(true);
      // Mark as read
      if (announcements.length > 0) {
        localStorage.setItem('myanlex_last_viewed_announcement', announcements[0].id);
        setHasNewAnnouncements(false);
      }
    }
  };

  const handleLoginSuccess = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setShowLogin(false);
    
    // Check subscription immediately
    if (currentUser) {
      const subStatus = checkSubscription(currentUser);
      if (!subStatus.valid) {
        setShowSubscription(true);
      } else {
        // If valid, go to search or admin
        if (currentUser.role === 'ADMIN' || currentUser.role === 'EDITOR') {
          handleNavigate('ADMIN');
        } else {
          handleNavigate('SEARCH');
        }
      }
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setViewStack(['HOME']); // Reset history on logout
    setShowSubscription(false);
  };

  // Navigation Logic
  const handleNavigate = (target: ViewState) => {
    // Guest protection for Admin/Saved views
    if (!user && (target === 'ADMIN' || target === 'SAVED' || target === 'TEAM' || target === 'MULTI_ANALYSIS')) {
      setShowLogin(true);
      return;
    }

    // Check sub again on navigation for logged in users
    if (user && target !== 'HOME') {
      const subStatus = checkSubscription(user);
      if (!subStatus.valid) {
        setShowSubscription(true);
        return;
      }
    }

    // STRICT HOME RESET (Requested Feature)
    if (target === 'HOME') {
        setSearchQuery('');
        setFilteredCases(searchCases(''));
        setSelectedCase(null);
        setAnalysisCases([]);
        setViewStack(['HOME']); // Clear stack, reset to root
        return; 
    }

    if (target === 'SEARCH') {
      // Keep query if existing, or just ensure filtered cases are updated if needed
      if (!searchQuery) {
          setFilteredCases(searchCases(''));
      }
    }

    if (target === 'SAVED' && user) {
        // We do NOT set filteredCases here anymore, SearchResults handles the folder view logic
        // We just navigate to the view
    }

    // Push to stack if not already active
    if (target !== view) {
      setViewStack(prev => [...prev, target]);
    }
  };

  const handleBack = () => {
    if (viewStack.length > 1) {
      setViewStack(prev => prev.slice(0, prev.length - 1));
    }
  };

  // Callback to refresh data when a folder is updated
  const handleFolderUpdate = () => {
      const freshUser = getCurrentUser(); // Fetch fresh user data from LS
      setUser(freshUser);
  };

  const toggleAdmin = () => {
    if (!user) {
      setShowLogin(true);
    } else if (user.role === 'ADMIN' || user.role === 'EDITOR') {
      handleNavigate('ADMIN');
    } else {
      alert("Access Denied: Admin rights required.");
    }
  };

  const handleSearch = (query: string) => {
    if (user) {
      const subStatus = checkSubscription(user);
      if (!subStatus.valid) {
        setShowSubscription(true);
        return;
      }
    }

    setSearchQuery(query);
    const results = searchCases(query);
    setFilteredCases(results);
    handleNavigate('SEARCH');
  };

  const handleSelectCase = (c: LegalCase) => {
    setSelectedCase(c);
    handleNavigate('DETAIL');
  };

  const handleMultiAnalyze = (selectedIds: string[], mode: AnalysisMode) => {
      const cases = selectedIds.map(id => getCaseById(id)).filter(c => c !== undefined) as LegalCase[];
      if (cases.length === 0) return;
      
      setAnalysisCases(cases);
      setAnalysisMode(mode);
      handleNavigate('MULTI_ANALYSIS');
  };

  // NEW: Save Logic Prompt
  const handleSaveRequest = (caseId: string) => {
      if(!user) {
          setShowRegister(true);
          return;
      }
      setCaseToSaveId(caseId);
      setSaveModalOpen(true);
  };

  const handleExecuteSave = (folderId: string) => {
      if (!user || !caseToSaveId) return;

      if (folderId === 'general') {
          // Legacy behavior: toggle in 'savedCaseIds' (acts as General)
          // Ensure it's added
          if (!user.savedCaseIds?.includes(caseToSaveId)) {
             toggleSavedCase(user.id, caseToSaveId);
          }
      } else {
          addCaseToFolder(user.id, folderId, caseToSaveId);
      }
      
      handleFolderUpdate();
      setSaveModalOpen(false);
      setCaseToSaveId(null);
  };

  // --- LOADING SCREEN ---
  if (!isDbReady) {
      return (
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
              <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full blur opacity-50 animate-pulse"></div>
                  <div className="relative bg-slate-900 rounded-full p-6 ring-1 ring-gold-500/50">
                      <Scale className="h-16 w-16 text-gold-500" />
                  </div>
              </div>
              <h1 className="mt-8 text-2xl font-serif text-white font-bold tracking-wide">MYANLEX</h1>
              <div className="mt-4 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce"></div>
              </div>
              <p className="mt-4 text-slate-400 text-xs uppercase tracking-widest">Initializing Secure Database...</p>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F6] font-sans text-slate-800 relative flex flex-col">
      <Navbar 
        onNavigate={handleNavigate} 
        onBack={handleBack}
        canGoBack={viewStack.length > 1}
        isAdmin={user?.role === 'ADMIN' || user?.role === 'EDITOR'} 
        toggleAdmin={toggleAdmin}
        user={user}
        onLogout={handleLogout}
        onShowPricing={() => setShowPricing(true)}
        onShowNotifications={handleNotificationsOpen}
        onShowSupport={() => setShowSupport(true)}
        hasNotifications={hasNewAnnouncements}
      />

      <NotificationsModal 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        announcements={announcements}
      />

      {user && (
        <SaveCaseModal 
            isOpen={saveModalOpen}
            onClose={() => setSaveModalOpen(false)}
            user={user}
            onSaveToFolder={handleExecuteSave}
            onFolderCreated={handleFolderUpdate}
        />
      )}

      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)}
        onSuccess={handleLoginSuccess}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={handleLoginSuccess}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />

      <SubscriptionModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        variant="info"
      />

      <SubscriptionModal
        isOpen={showSubscription}
        onClose={handleLogout}
        variant="expired"
      />

      <SupportModal
        isOpen={showSupport}
        onClose={() => setShowSupport(false)}
      />

      <main className="flex-grow">
        {view === 'HOME' && (
          <Hero 
              onSearch={handleSearch} 
              onShowPricing={() => setShowPricing(true)}
          />
        )}

        {(view === 'SEARCH' || view === 'SAVED') && (
          <SearchResults 
            cases={filteredCases} 
            query={searchQuery} 
            onSelectCase={handleSelectCase}
            savedCaseIds={user?.savedCaseIds || []}
            onToggleSave={handleSaveRequest} // Triggers modal
            isSavedView={view === 'SAVED'}
            user={user}
            onFolderUpdate={handleFolderUpdate}
            onAnalyze={handleMultiAnalyze} // Pass handler
          />
        )}

        {view === 'DETAIL' && selectedCase && (
          <CaseDetail 
            data={selectedCase} 
            onBack={handleBack} 
            user={user}
            onToggleSave={handleSaveRequest} // Triggers modal
            onShowRegister={() => setShowRegister(true)}
          />
        )}

        {/* NEW MULTI-ANALYSIS VIEW */}
        {view === 'MULTI_ANALYSIS' && analysisCases.length > 0 && (
            <MultiAnalysisView 
                cases={analysisCases}
                mode={analysisMode}
                onBack={handleBack}
                user={user}
                onShowRegister={() => setShowRegister(true)}
            />
        )}

        {view === 'RESOURCES' && (
          <Resources />
        )}

        {view === 'ADMIN' && (user?.role === 'ADMIN' || user?.role === 'EDITOR') && (
          <AdminPanel currentUser={user} />
        )}

        {view === 'TEAM' && user && user.organizationId && (
          <TeamDashboard user={user} />
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm border-t border-slate-800">
        <p>© {new Date().getFullYear()} Myanlex. All rights reserved.</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
