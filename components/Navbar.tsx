import React from 'react';
import { Scale, Shield, User as UserIcon, Search, LogOut, CreditCard, Bell, HelpCircle, Book, Bookmark } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  onNavigate: (view: any) => void;
  isAdmin: boolean;
  toggleAdmin: () => void;
  user: User | null;
  onLogout: () => void;
  onShowPricing: () => void;
  onShowNotifications: () => void;
  onShowSupport: () => void;
  hasNotifications: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onNavigate, isAdmin, toggleAdmin, user, onLogout, 
  onShowPricing, onShowNotifications, onShowSupport, hasNotifications 
}) => {
  return (
    <nav className="bg-slate-900 border-b border-white/10 sticky top-0 z-50 backdrop-blur-md bg-slate-900/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 py-3">
          <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('HOME')}>
            <div className="bg-white/5 p-2 rounded-lg border border-white/10 mr-3 group-hover:bg-white/10 transition">
                <Scale className="h-6 w-6 text-gold-400" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-serif text-xl font-bold tracking-wide text-white">MYANLEX</span>
              <span className="text-[10px] text-gold-400/80 uppercase tracking-[0.2em] font-medium">Legal Intelligence</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <NavButton onClick={() => onNavigate('SEARCH')} icon={<Search />} label="Case Law" />
            <NavButton onClick={() => onNavigate('RESOURCES')} icon={<Book />} label="Resources" />
            {user && (
                <NavButton onClick={() => onNavigate('SAVED')} icon={<Bookmark />} label="Saved" />
            )}
            <NavButton onClick={onShowPricing} icon={<CreditCard />} label="Pricing" />

            <div className="h-6 w-px bg-white/10 mx-2"></div>

            {/* Notification Bell */}
            <button 
              onClick={onShowNotifications} 
              className="relative text-gray-400 hover:text-gold-400 transition p-2 rounded-full hover:bg-white/5"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {hasNotifications && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full border border-slate-900"></span>
              )}
            </button>

            {/* Support Icon */}
            <button 
              onClick={onShowSupport} 
              className="text-gray-400 hover:text-gold-400 transition p-2 rounded-full hover:bg-white/5"
              title="Customer Support"
            >
              <HelpCircle className="h-5 w-5" />
            </button>

            <div className="h-6 w-px bg-white/10 mx-2"></div>
            
            {user ? (
              <div className="flex items-center gap-3 pl-2">
                <div className="flex flex-col text-right hidden sm:block">
                  <span className="text-sm font-semibold text-white leading-none mb-1">{user.name}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-gold-400 inline-block ml-auto">
                    {user.role === 'ADMIN' ? 'Admin' : user.isTrial ? 'Trial' : 'Premium'}
                  </span>
                </div>
                
                {isAdmin && (
                  <button 
                    onClick={toggleAdmin}
                    className="flex items-center justify-center p-2 rounded-lg bg-gold-500 text-slate-900 hover:bg-gold-400 transition shadow-lg shadow-gold-500/20"
                    title="Admin Panel"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                )}

                <button 
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-red-400 transition hover:bg-white/5 rounded-full"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={toggleAdmin} // Triggers login
                className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm text-slate-900 bg-gold-400 hover:bg-gold-500 transition shadow-lg shadow-gold-500/20"
              >
                <UserIcon className="h-4 w-4" /> <span className="hidden sm:inline">Member Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavButton = ({ onClick, icon, label }: { onClick: () => void, icon: any, label: string }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition">
        {React.cloneElement(icon, { className: "h-4 w-4 text-gold-500/80" })}
        <span className="hidden md:inline">{label}</span>
    </button>
);
