import React, { useState, useEffect } from 'react';
import { X, MessageSquare, AlertCircle, CreditCard, HelpCircle, Phone, Send, Mail, User } from 'lucide-react';
import { getConfig, saveTicket } from '../services/db';
import { BillingConfig, SupportTicket } from '../types';
import { getCurrentUser } from '../services/auth';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState('BILLING');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getConfig());
      setSent(false);
      setMessage('');
      setSubject('');
      
      const user = getCurrentUser();
      if (user) {
        setContactInfo(user.email);
      } else {
        setContactInfo('');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = getCurrentUser();
    
    const newTicket: SupportTicket = {
      id: Date.now().toString(),
      senderName: user ? user.name : 'Guest User',
      contactInfo: contactInfo,
      category,
      subject,
      message,
      status: 'OPEN',
      date: new Date().toISOString()
    };

    saveTicket(newTicket);
    setSent(true);
    
    setTimeout(() => {
       onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-slate-50">
           <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-gold-500" /> Customer Support
           </h2>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
             <X className="h-6 w-6" />
           </button>
        </div>

        <div className="flex flex-col md:flex-row h-full">
           {/* Sidebar Categories */}
           <div className="w-full md:w-1/3 bg-slate-50 p-4 border-r border-gray-100 space-y-2">
              <button 
                 onClick={() => setCategory('BILLING')}
                 className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${category === 'BILLING' ? 'bg-white shadow text-slate-900 font-bold' : 'text-gray-600 hover:bg-white/50'}`}
              >
                 <CreditCard className="h-4 w-4" /> Billing Issue
              </button>
              <button 
                 onClick={() => setCategory('TECH')}
                 className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${category === 'TECH' ? 'bg-white shadow text-slate-900 font-bold' : 'text-gray-600 hover:bg-white/50'}`}
              >
                 <AlertCircle className="h-4 w-4" /> Technical Problem
              </button>
              <button 
                 onClick={() => setCategory('CONTENT')}
                 className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${category === 'CONTENT' ? 'bg-white shadow text-slate-900 font-bold' : 'text-gray-600 hover:bg-white/50'}`}
              >
                 <MessageSquare className="h-4 w-4" /> Content Complaint
              </button>
           </div>

           {/* Content */}
           <div className="flex-1 p-6">
              {sent ? (
                 <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                       <Send className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Message Sent!</h3>
                    <p className="text-gray-500 mt-2">The admin team has received your message.</p>
                 </div>
              ) : (
                 <>
                    <div className="mb-6 bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                       <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-blue-800 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-blue-900 uppercase">Immediate Assistance</p>
                            <p className="text-sm font-mono font-bold text-slate-900">{config?.support?.phone || "Loading..."}</p>
                          </div>
                       </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                       <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Your Contact Info</label>
                          <div className="relative">
                             <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                             <input 
                                required
                                type="text" 
                                value={contactInfo}
                                onChange={(e) => setContactInfo(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm"
                                placeholder="Email or Phone Number"
                             />
                          </div>
                       </div>
                       
                       <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Subject</label>
                          <input 
                             required
                             type="text" 
                             value={subject}
                             onChange={(e) => setSubject(e.target.value)}
                             className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm"
                             placeholder="Briefly describe the issue"
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Details</label>
                          <textarea 
                             required
                             value={message}
                             onChange={(e) => setMessage(e.target.value)}
                             className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-gold-500 outline-none text-sm h-24 resize-none"
                             placeholder="Provide as much detail as possible..."
                          />
                       </div>
                       <button 
                          type="submit"
                          className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                       >
                          Submit Request
                       </button>
                    </form>
                 </>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
