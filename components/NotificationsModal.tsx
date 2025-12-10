import React from 'react';
import { X, Bell, Info, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { Announcement } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, announcements }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 z-[100] w-96 animate-in fade-in zoom-in duration-200 origin-top-right">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-slate-50">
           <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold-500" /> Notifications
           </h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
             <X className="w-4 h-4" />
           </button>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {announcements.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No new announcements.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
               {announcements.map((ann) => (
                 <div key={ann.id} className={`p-4 hover:bg-gray-50 transition ${ann.type === 'URGENT' ? 'bg-red-50/50' : ''}`}>
                    <div className="flex gap-3 items-start">
                       <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          ann.type === 'URGENT' ? 'bg-red-100 text-red-600' :
                          ann.type === 'WARNING' ? 'bg-orange-100 text-orange-600' :
                          ann.type === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-blue-600'
                       }`}>
                          {ann.type === 'URGENT' && <Zap className="w-3 h-3" />}
                          {ann.type === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                          {ann.type === 'SUCCESS' && <CheckCircle className="w-3 h-3" />}
                          {ann.type === 'INFO' && <Info className="w-3 h-3" />}
                       </div>
                       <div>
                          <h4 className="text-sm font-bold text-slate-900">{ann.title}</h4>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">{ann.message}</p>
                          <span className="text-[10px] text-gray-400 mt-2 block">{new Date(ann.date).toLocaleDateString()}</span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
