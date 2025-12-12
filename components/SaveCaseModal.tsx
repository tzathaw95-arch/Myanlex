
import React, { useState } from 'react';
import { X, FolderPlus, Folder, Check } from 'lucide-react';
import { User } from '../types';
import { createFolder } from '../services/db';

interface SaveCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSaveToFolder: (folderId: string) => void; // 'general' or specific ID
  onFolderCreated: () => void;
}

export const SaveCaseModal: React.FC<SaveCaseModalProps> = ({ isOpen, onClose, user, onSaveToFolder, onFolderCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(user.id, newFolderName);
      setNewFolderName('');
      setIsCreating(false);
      onFolderCreated(); // Refresh user data in parent
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-slate-50">
           <h3 className="font-bold text-slate-900">Save Case To...</h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
             <X className="w-5 h-5" />
           </button>
        </div>
        
        <div className="p-2 max-h-80 overflow-y-auto">
            {/* General / Quick Save */}
            <button 
                onClick={() => onSaveToFolder('general')}
                className="w-full flex items-center gap-3 p-3 hover:bg-gold-50 hover:text-gold-900 rounded-lg transition text-left group"
            >
                <div className="bg-gray-100 group-hover:bg-gold-200 p-2 rounded-lg text-gray-500 group-hover:text-gold-700">
                    <Folder className="w-5 h-5" />
                </div>
                <div>
                    <div className="font-bold text-sm text-slate-800">General Items</div>
                    <div className="text-xs text-gray-500">Uncategorized saves</div>
                </div>
            </button>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Existing Folders */}
            <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">My Folders</div>
            {user.folders && user.folders.map(folder => (
                <button 
                    key={folder.id}
                    onClick={() => onSaveToFolder(folder.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 hover:text-blue-900 rounded-lg transition text-left group"
                >
                    <div className="bg-blue-50 group-hover:bg-blue-200 p-2 rounded-lg text-blue-500 group-hover:text-blue-700">
                        <Folder className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-sm text-slate-800">{folder.name}</div>
                </button>
            ))}

            {user.folders?.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400 italic">No custom folders yet.</div>
            )}
        </div>

        {/* Footer / Create New */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
            {isCreating ? (
                <form onSubmit={handleCreate} className="flex gap-2">
                    <input 
                        autoFocus
                        type="text" 
                        className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                        placeholder="Folder Name..."
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                    />
                    <button type="submit" className="bg-slate-900 text-white p-2 rounded hover:bg-slate-700">
                        <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setIsCreating(false)} className="text-gray-500 p-2 hover:text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </form>
            ) : (
                <button 
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 border border-dashed border-gray-300 hover:border-slate-400 rounded-lg py-2 transition"
                >
                    <FolderPlus className="w-4 h-4" /> Create New Folder
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
