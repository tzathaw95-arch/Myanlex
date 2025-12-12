
import React, { useState } from 'react';
import { X, Lock, Mail, ArrowLeft, Send } from 'lucide-react';
import { login, recoverPassword } from '../services/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess, onSwitchToRegister }) => {
  const [view, setView] = useState<'LOGIN' | 'FORGOT'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Feedback states
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const resetState = () => {
      setView('LOGIN');
      setEmail('');
      setPassword('');
      setLocalError('');
      setSuccessMsg('');
  }

  const handleClose = () => {
      resetState();
      onClose();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!email || !password) {
      setLocalError("Please fill in all fields");
      return;
    }

    const result = login(email, password);
    if (result.success) {
      onSuccess();
      handleClose();
    } else {
      setLocalError(result.error || "Login failed");
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError('');
      setSuccessMsg('');
      
      if (!email) {
          setLocalError("Please enter your email address.");
          return;
      }

      const result = recoverPassword(email);
      if (result.success) {
          setSuccessMsg("(Demo Simulation: No real email is sent in this prototype environment.)");
      } else {
          setSuccessMsg("If an account exists, a recovery link has been sent.");
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
          <X className="h-6 w-6" />
        </button>
        
        {/* LOGIN VIEW */}
        {view === 'LOGIN' && (
            <>
                <div className="text-center mb-8">
                <div className="bg-slate-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ring-4 ring-slate-50">
                    <Lock className="h-10 w-10 text-slate-900" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">Member Login</h2>
                <p className="text-gray-500 text-sm mt-1">Access your Myanlex account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                {localError && (
                    <div className="text-red-600 text-sm text-center bg-red-50 border border-red-100 p-3 rounded-lg font-medium">
                    {localError}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative group">
                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-gold-500 transition-colors" />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-shadow"
                        placeholder="user@example.com"
                    />
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-bold text-gray-700">Password</label>
                        <button 
                            type="button" 
                            onClick={() => {
                                setView('FORGOT');
                                setLocalError('');
                                setSuccessMsg('');
                            }}
                            className="text-xs text-gold-600 hover:underline font-medium"
                        >
                            Forgot Password?
                        </button>
                    </div>
                    <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-gold-500 transition-colors" />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-shadow"
                        placeholder="••••••••"
                    />
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-slate-900 text-white py-3.5 rounded-lg font-bold hover:bg-slate-800 transition shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-0.5"
                >
                    Login
                </button>
                </form>
                
                <div className="mt-6 text-center text-sm">
                <span className="text-gray-500">New to Myanlex? </span>
                <button onClick={onSwitchToRegister} className="text-gold-600 font-bold hover:underline">
                    Start Free Trial
                </button>
                </div>
            </>
        )}

        {/* FORGOT PASSWORD VIEW */}
        {view === 'FORGOT' && (
            <>
                <button 
                    onClick={() => setView('LOGIN')}
                    className="absolute top-4 left-4 text-gray-400 hover:text-slate-900 transition flex items-center gap-1 text-xs font-bold uppercase"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>

                <div className="text-center mb-8 mt-4">
                    <div className="bg-gold-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ring-4 ring-gold-50/50">
                        <Mail className="h-10 w-10 text-gold-600" />
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-slate-900">Recovery</h2>
                    <p className="text-gray-500 text-sm mt-1">Enter email to reset password</p>
                </div>

                {successMsg ? (
                    <div className="text-center py-6">
                        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 mb-6 shadow-sm">
                            <p className="font-bold mb-1">Link Sent (Simulated)</p>
                            <p className="text-sm">{successMsg}</p>
                        </div>
                        <button 
                            onClick={() => setView('LOGIN')}
                            className="w-full bg-slate-900 text-white py-3.5 rounded-lg font-bold hover:bg-slate-800 transition"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleForgotSubmit} className="space-y-5">
                        {localError && (
                            <div className="text-red-600 text-sm text-center bg-red-50 border border-red-100 p-3 rounded-lg font-medium">
                            {localError}
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                            <div className="relative group">
                            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-gold-500 transition-colors" />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-shadow"
                                placeholder="Registered email..."
                            />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-slate-900 text-white py-3.5 rounded-lg font-bold hover:bg-slate-800 transition shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <Send className="w-4 h-4" /> Send Recovery Link
                        </button>
                    </form>
                )}
            </>
        )}
      </div>
    </div>
  );
};
