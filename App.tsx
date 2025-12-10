import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { SearchResults } from './components/SearchResults';
import { CaseDetail } from './components/CaseDetail';
import { AdminPanel } from './components/AdminPanel';
import { Resources } from './components/Resources';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { NotificationsModal } from './components/NotificationsModal';
import { SupportModal } from './components/SupportModal';
import { LegalCase, ViewState, User, Announcement } from './types';
import { searchCases, getAnnouncements, toggleSavedCase, getCases } from './services/db';
import { getCurrentUser, logout, checkSubscription } from './services/auth';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [user, setUser] = useState<User | null>(null);
  
  // Modals
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  
  // Data State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [filteredCases, setFilteredCases] = useState<LegalCase[]>(searchCases(''));
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);

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
    const checkAnnouncements = () => {
       const list = getAnnouncements();
       setAnnouncements(list);
       
       // Simple check: if list is not empty and different from "last seen" logic
       // For this demo, if there is ANY active announcement, we show red dot unless we viewed it in this session
       // A more robust way would be storing "lastViewedAnnouncementId" in localStorage
       const lastViewedId = localStorage.getItem('myanlex_last_viewed_announcement');
       if (list.length > 0 && list[0].id !== lastViewedId) {
         setHasNewAnnouncements(true);
       } else {
         setHasNewAnnouncements(false);
       }
    };
    
    checkAnnouncements();
    const interval = setInterval(checkAnnouncements, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

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
        if (currentUser.role === 'ADMIN') {
          setView('ADMIN');
        } else {
          setView('SEARCH');
        }
      }
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setView('HOME');
    setShowSubscription(false);
  };

  // Navigation Logic
  const handleNavigate = (target: ViewState) => {
    // Guest protection for Admin/Saved views
    if (!user && (target === 'ADMIN' || target === 'SAVED')) {
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

    if (target === 'SEARCH') {
      setSearchQuery('');
      setFilteredCases(searchCases(''));
    }

    if (target === 'SAVED' && user) {
        setSearchQuery('Saved Cases');
        // Filter cases that are in user.savedCaseIds
        const allCases = getCases();
        const saved = allCases.filter(c => user.savedCaseIds?.includes(c.id));
        setFilteredCases(saved);
    }

    setView(target);
  };

  const toggleAdmin = () => {
    if (!user) {
      setShowLogin(true);
    } else if (user.role === 'ADMIN') {
      setView('ADMIN');
    } else {
      alert("Access Denied: Admin rights required.");
    }
  };

  const handleSearch = (query: string) => {
    // Guest Search allowed now.
    
    // Check sub if user is logged in
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
    setView('SEARCH');
  };

  const handleSelectCase = (c: LegalCase) => {
    setSelectedCase(c);
    setView('DETAIL');
  };

  const handleToggleSave = (caseId: string) => {
      if(!user) {
          setShowRegister(true);
          return;
      }
      const updatedUser = toggleSavedCase(user.id, caseId);
      if (updatedUser) {
          setUser(updatedUser);
      }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F6] font-sans text-slate-800 relative flex flex-col">
      <Navbar 
        onNavigate={handleNavigate} 
        isAdmin={user?.role === 'ADMIN'} 
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
            onToggleSave={handleToggleSave}
            isSavedView={view === 'SAVED'}
          />
        )}

        {view === 'DETAIL' && selectedCase && (
          <CaseDetail 
            data={selectedCase} 
            onBack={() => setView('SEARCH')} 
            user={user}
            onToggleSave={handleToggleSave}
            onShowRegister={() => setShowRegister(true)}
          />
        )}

        {view === 'RESOURCES' && (
          <Resources />
        )}

        {view === 'ADMIN' && user?.role === 'ADMIN' && (
          <AdminPanel />
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm border-t border-slate-800">
        <p>© {new Date().getFullYear()} Myanlex. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;
