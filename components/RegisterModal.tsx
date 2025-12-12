
import React, { useState } from 'react';
import { X, UserPlus, Mail, Lock, User, Eye, EyeOff, Building2, CheckCircle, ArrowRight } from 'lucide-react';
import { registerTrial } from '../services/auth';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Firm Registration State
  const [isFirm, setIsFirm] = useState(false);
  const [firmName, setFirmName] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (isFirm && !firmName) {
      setError("Please enter your Law Firm name.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const result = registerTrial(email, password, name, isFirm ? firmName : undefined);
    if (result.success) {
      setSuccess(true);
      // Wait for user to click continue
    } else {
      setError(result.error || "Registration failed");
    }
  };

  const handleContinue = () => {
      onSuccess();
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
        {!success && (
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
            <X className="h-6 w-6" />
            </button>
        )}
        
        {success ? (
            <div className="text-center py-6">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-50 animate-bounce">
                    <CheckCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created Successfully!</h2>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 mb-6 mx-auto max-w-xs">
                    <p className="text-amber-900 text-sm font-bold mb-1">
                        ⚠️ Demo Simulation Mode
                    </p>
                    <p className="text-amber-800 text-xs">
                        This is a prototype. No real email will be sent to <strong>{email}</strong>. 
                        Your trial is activated automatically.
                    </p>
                </div>
                <p className="text-sm text-gray-500 mb-8">
                    Your 2-week free trial has been activated instantly.
                </p>
                <button 
                    onClick={handleContinue}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-lg font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 group"
                >
                    Continue to Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        ) : (
            <>
                <div className="text-center mb-6">
                <div className="bg-gold-50 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ring-4 ring-gold-50/50">
                    {isFirm ? <Building2 className="h-10 w-10 text-gold-600" /> : <UserPlus className="h-10 w-10 text-gold-600" />}
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                    {isFirm ? 'Create Firm Account' : 'Start Free Trial'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">Get 2 weeks of full access to Myanlex.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="text-red-600 text-sm text-center bg-red-50 border border-red-100 p-3 rounded-lg font-medium">
                    {error}
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative group">
                    <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-gold-500 transition-colors" />
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-shadow"
                        placeholder="U Kyaw Hein"
                    />
                    </div>
                </div>

                {/* Firm Toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-sm font-bold text-slate-700">Registering as a Law Firm?</span>
                    <button 
                    type="button"
                    onClick={() => setIsFirm(!isFirm)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isFirm ? 'bg-gold-500' : 'bg-gray-300'}`}
                    >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isFirm ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                </div>

                {isFirm && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Law Firm Name</label>
                        <div className="relative group">
                        <Building2 className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-gold-500 transition-colors" />
                        <input 
                            type="text" 
                            value={firmName}
                            onChange={(e) => setFirmName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-shadow"
                            placeholder="Myanmar Legal Associates"
                        />
                        </div>
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
                        placeholder="you@example.com"
                    />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                    <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-gold-500 transition-colors" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-shadow"
                        placeholder="Create a password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative group">
                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-gold-500 transition-colors" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent outline-none transition-shadow"
                        placeholder="Confirm your password"
                    />
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-gold-500 text-slate-900 py-3.5 rounded-lg font-bold hover:bg-gold-400 transition shadow-lg hover:shadow-xl translate-y-0 hover:-translate-y-0.5"
                >
                    {isFirm ? 'Create Firm Account' : 'Start 2-Week Free Trial'}
                </button>
                </form>

                <div className="mt-6 text-center text-sm">
                <span className="text-gray-500">Already have an account? </span>
                <button onClick={onSwitchToLogin} className="text-slate-900 font-bold hover:underline">
                    Login here
                </button>
                </div>
            </>
        )}
      </div>
    </div>
  );
};
