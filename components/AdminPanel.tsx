import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Trash2, Database, Users, Calendar, Settings, Save, Ban, Clock, Bell, Megaphone, Phone, Mail, Inbox, MessageSquare, Check, Edit2, X, Plus } from 'lucide-react';
import { detectAndSplitCases, readFileAsText, readPdfFile } from '../services/pdfProcessor';
import { extractCaseData } from '../services/geminiService';
import { saveCase, clearDatabase, getCases, getUsers, saveUser, getConfig, saveConfig, getAnnouncements, saveAnnouncement, deleteAnnouncement, getTickets, updateTicketStatus, deleteTicket } from '../services/db';
import { UploadQueueItem, User, BillingConfig, Announcement, SupportTicket, LegalCase } from '../types';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DATABASE' | 'USERS' | 'INBOX' | 'ANNOUNCEMENTS' | 'SETTINGS'>('DATABASE');
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dbStats, setDbStats] = useState({ count: getCases().length });
  
  // Database Edit State
  const [allCases, setAllCases] = useState<LegalCase[]>([]);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<LegalCase>>({});
  
  // Manual Entry State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCase, setManualCase] = useState<Partial<LegalCase>>({
      caseType: 'Civil',
      court: 'Supreme Court of the Union',
      judges: [],
      content: ''
  });

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [extensionMonths, setExtensionMonths] = useState(1);

  // Settings State
  const [config, setConfig] = useState<BillingConfig>(getConfig());
  const [saveStatus, setSaveStatus] = useState('');

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'INFO' as const });

  // Inbox State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    if (activeTab === 'DATABASE') {
        const cases = getCases();
        setAllCases(cases);
        setDbStats({ count: cases.length });
    }
    if (activeTab === 'USERS') setUsers(getUsers());
    if (activeTab === 'SETTINGS') setConfig(getConfig());
    if (activeTab === 'ANNOUNCEMENTS') setAnnouncements(getAnnouncements());
    if (activeTab === 'INBOX') setTickets(getTickets());
  }, [activeTab]);

  // --- File Upload Logic ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const newQueueItems: UploadQueueItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      status: 'PENDING',
      totalCasesDetected: 0,
      processedCases: 0
    }));

    setQueue(prev => [...newQueueItems, ...prev]);

    // Process Files One by One
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const queueId = newQueueItems[i].id;
      
      try {
        updateQueueStatus(queueId, 'PROCESSING');
        
        let text = "";
        // Basic check for PDF vs Text. 
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          text = await readPdfFile(file);
        } else {
          text = await readFileAsText(file);
        }
        
        const cases = await detectAndSplitCases(text);
        updateQueueStatus(queueId, 'PROCESSING', { totalCasesDetected: cases.length });

        for (let j = 0; j < cases.length; j++) {
            await new Promise(r => setTimeout(r, 4000)); // Delay for API rate limits
            
            const caseText = cases[j];
            try {
                const structuredCase = await extractCaseData(caseText, file.name, j);
                saveCase(structuredCase);
                updateQueueStatus(queueId, 'PROCESSING', { processedCases: j + 1 });
            } catch (err) {
                console.error(`Failed to process case ${j} in ${file.name}`, err);
            }
        }
        
        updateQueueStatus(queueId, 'COMPLETED');
        refreshStats();
        setAllCases(getCases()); // Refresh list
      } catch (err) {
        console.error(err);
        updateQueueStatus(queueId, 'ERROR', { error: (err as Error).message });
      }
    }
  };

  const updateQueueStatus = (id: string, status: UploadQueueItem['status'], updates?: Partial<UploadQueueItem>) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, status, ...updates } : item));
  };

  const refreshStats = () => {
      const c = getCases();
      setDbStats({ count: c.length });
      setAllCases(c);
  };

  const handleResetDb = () => {
      if (confirm("Are you sure you want to reset the database? This cannot be undone.")) {
          clearDatabase();
          refreshStats();
      }
  };

  // --- Manual Entry Logic ---
  const handleManualSave = (closeAfterSave: boolean) => {
    if (!manualCase.caseName || !manualCase.citation || !manualCase.content) {
        alert("Please fill in at least Case Name, Citation, and Content.");
        return;
    }

    const newCase: LegalCase = {
        id: `manual-${Date.now()}`,
        caseName: manualCase.caseName,
        caseNameEnglish: manualCase.caseNameEnglish || '',
        citation: manualCase.citation,
        court: manualCase.court || 'Supreme Court',
        judges: typeof manualCase.judges === 'string' ? (manualCase.judges as string).split(',').map((j: string) => j.trim()) : [],
        date: manualCase.date || new Date().toISOString().split('T')[0],
        caseType: manualCase.caseType || 'Civil',
        content: manualCase.content,
        summary: manualCase.summary || '',
        holding: manualCase.holding || '',
        legalIssues: manualCase.legalIssues || [],
        parties: manualCase.parties || {},
        extractionDate: new Date().toISOString(),
        sourcePdfName: 'Manual Entry',
        extractionConfidence: 100,
        extractedSuccessfully: true,
        headnotes: []
    };

    saveCase(newCase);
    refreshStats();
    
    if (closeAfterSave) {
        setShowManualModal(false);
    }
    
    // Reset Form for next entry
    setManualCase({
        caseType: 'Civil',
        court: 'Supreme Court of the Union',
        judges: [],
        content: ''
    });

    if (!closeAfterSave) {
        // Optional feedback
        alert("Case saved. Ready for next entry.");
    }
  };

  // --- Database Editing Logic ---
  const startEditCase = (c: LegalCase) => {
    setEditingCaseId(c.id);
    setEditFormData({
      caseName: c.caseName,
      caseType: c.caseType,
      court: c.court,
      citation: c.citation
    });
  };

  const saveEditCase = () => {
    if(!editingCaseId) return;
    
    // Find the original case and merge
    const updatedCases = allCases.map(c => {
      if (c.id === editingCaseId) {
        return { ...c, ...editFormData };
      }
      return c;
    });

    // Update Local Storage
    localStorage.setItem("myanlex_cases", JSON.stringify(updatedCases));
    setAllCases(updatedCases);
    setEditingCaseId(null);
    setEditFormData({});
  };

  const deleteCase = (id: string) => {
    if(confirm("Delete this case?")) {
       const updatedCases = allCases.filter(c => c.id !== id);
       localStorage.setItem("myanlex_cases", JSON.stringify(updatedCases));
       setAllCases(updatedCases);
       setDbStats({ count: updatedCases.length });
    }
  };

  // --- User Management Logic ---
  const handleExtendSubscription = (user: User) => {
    const currentExpiry = new Date(user.subscriptionExpiry);
    const now = new Date();
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.setMonth(baseDate.getMonth() + extensionMonths));
    
    // Unban user if extending
    const updatedUser = { ...user, subscriptionExpiry: newExpiry.toISOString(), isTrial: false, isBanned: false };
    saveUser(updatedUser);
    setUsers(getUsers());
    setEditingUser(null);
    alert(`Extended ${user.name}'s subscription.`);
  };

  const handleBanUser = (user: User) => {
    if (confirm(`Are you sure you want to revoke access for ${user.name}? This will block their login.`)) {
      const updatedUser = { ...user, isBanned: true };
      saveUser(updatedUser);
      setUsers(getUsers());
    }
  };

  const getDaysRemaining = (isoDate: string) => {
    const now = new Date().getTime();
    const expiry = new Date(isoDate).getTime();
    const diff = expiry - now;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // --- Settings Logic ---
  const handleConfigSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(config);
    setSaveStatus('Saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // --- Announcement Logic ---
  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if(!newAnnouncement.title || !newAnnouncement.message) return;

    const announcement: Announcement = {
      id: Date.now().toString(),
      title: newAnnouncement.title,
      message: newAnnouncement.message,
      type: newAnnouncement.type,
      date: new Date().toISOString(),
      isActive: true
    };

    saveAnnouncement(announcement);
    setAnnouncements(getAnnouncements());
    setNewAnnouncement({ title: '', message: '', type: 'INFO' });
  };

  const handleDeleteAnnouncement = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm("Delete this announcement?")) {
      deleteAnnouncement(id);
      // Immediately update local state to reflect change without needing a full reload
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  // --- Inbox Logic ---
  const handleResolveTicket = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateTicketStatus(id, 'RESOLVED');
    // Update local state immediately
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'RESOLVED' } : t));
  };

  const handleDeleteTicket = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm("Delete this ticket permanently?")) {
      deleteTicket(id);
      // Immediately update local state to remove item from UI
      setTickets(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Database className="text-gold-500" /> 
            Admin Panel
        </h1>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('DATABASE')}
            className={`px-4 py-2 rounded font-medium text-sm whitespace-nowrap transition ${activeTab === 'DATABASE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-50'}`}
          >
            Database
          </button>
          <button 
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 rounded font-medium text-sm whitespace-nowrap transition ${activeTab === 'USERS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-50'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('INBOX')}
            className={`px-4 py-2 rounded font-medium text-sm whitespace-nowrap transition ${activeTab === 'INBOX' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-50'}`}
          >
            Inbox
          </button>
          <button 
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`px-4 py-2 rounded font-medium text-sm whitespace-nowrap transition ${activeTab === 'ANNOUNCEMENTS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-50'}`}
          >
            Announcements
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-4 py-2 rounded font-medium text-sm whitespace-nowrap transition ${activeTab === 'SETTINGS' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-50'}`}
          >
            Settings
          </button>
        </div>
      </div>

      {activeTab === 'DATABASE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-slate-900">Add Cases</h3>
                <button 
                  onClick={() => setShowManualModal(true)}
                  className="bg-gold-500 text-slate-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4" /> Add Manually
                </button>
            </div>

            <div 
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${
                dragActive ? 'border-gold-500 bg-gold-50' : 'border-gray-300 bg-white hover:border-slate-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Upload Legal Files</h3>
              <p className="text-gray-500 mb-6 text-sm">Supported: PDF, TXT, DOC/DOCX (Text extraction only)</p>
              <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  id="file-upload"
                  onChange={handleChange}
                  accept=".txt,.pdf,.doc,.docx" 
              />
              <label 
                  htmlFor="file-upload"
                  className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-slate-800 transition"
              >
                  Select Files
              </label>
            </div>

            {/* Queue */}
            {queue.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900">Processing Queue</h3>
                    <button onClick={() => setQueue([])} className="text-xs text-red-500 hover:text-red-700">Clear List</button>
                </div>
                <div className="divide-y divide-gray-100">
                    {queue.map(item => (
                        <div key={item.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-slate-400" />
                                <div>
                                    <div className="font-medium text-slate-900 text-sm">{item.fileName}</div>
                                    <div className="text-xs text-gray-500">
                                        {item.status}
                                        {item.status === 'PROCESSING' && ` (${item.processedCases}/${item.totalCasesDetected})`}
                                    </div>
                                </div>
                            </div>
                            <div>
                                {item.status === 'PROCESSING' && <RefreshCw className="h-5 w-5 text-gold-500 animate-spin" />}
                                {item.status === 'COMPLETED' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {item.status === 'ERROR' && <AlertCircle className="h-5 w-5 text-red-500" />}
                            </div>
                        </div>
                    ))}
                </div>
                </div>
            )}

            {/* Case List with Editing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900">Database Records ({dbStats.count})</h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto">
                    {allCases.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Database is empty.</div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2">Case Name</th>
                                    <th className="px-4 py-2">Category</th>
                                    <th className="px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {allCases.map(c => {
                                    const isEditing = editingCaseId === c.id;
                                    return (
                                        <tr key={c.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <input 
                                                        className="border rounded p-1 w-full text-xs"
                                                        value={editFormData.caseName}
                                                        onChange={e => setEditFormData({...editFormData, caseName: e.target.value})}
                                                    />
                                                ) : (
                                                    <div>
                                                        <div className="font-medium text-slate-900 line-clamp-1">{c.caseName}</div>
                                                        <div className="text-xs text-gray-400">{c.citation}</div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <select 
                                                        className="border rounded p-1 w-full text-xs"
                                                        value={editFormData.caseType}
                                                        onChange={e => setEditFormData({...editFormData, caseType: e.target.value})}
                                                    >
                                                        <option value="Administrative">Administrative</option>
                                                        <option value="Land">Land</option>
                                                        <option value="Criminal">Criminal</option>
                                                        <option value="Civil">Civil</option>
                                                        <option value="Family">Family</option>
                                                        <option value="Constitutional">Constitutional</option>
                                                        <option value="Corporate">Corporate</option>
                                                        <option value="Maritime">Maritime</option>
                                                        <option value="Labor">Labor</option>
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        c.caseType === 'Criminal' ? 'bg-red-100 text-red-700' :
                                                        c.caseType === 'Land' ? 'bg-green-100 text-green-700' :
                                                        c.caseType === 'Administrative' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {c.caseType}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 flex gap-2">
                                                {isEditing ? (
                                                    <>
                                                        <button onClick={saveEditCase} className="text-green-600 hover:text-green-800"><Check className="w-4 h-4" /></button>
                                                        <button onClick={() => setEditingCaseId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => startEditCase(c)} className="text-blue-500 hover:text-blue-700"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteCase(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

          </div>
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-slate-900 mb-4">Actions</h3>
                  <button onClick={handleResetDb} className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 p-2 rounded hover:bg-red-50 transition text-sm">
                      <Trash2 className="h-4 w-4" /> Reset Database
                  </button>
              </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button onClick={() => setShowManualModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-gold-500" /> Add Case Manually
                </h3>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Case Name *</label>
                            <input 
                                className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar"
                                value={manualCase.caseName || ''}
                                onChange={e => setManualCase({...manualCase, caseName: e.target.value})}
                                placeholder="U Hla v Daw Mya"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">English Name (Optional)</label>
                            <input 
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={manualCase.caseNameEnglish || ''}
                                onChange={e => setManualCase({...manualCase, caseNameEnglish: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Citation *</label>
                            <input 
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={manualCase.citation || ''}
                                onChange={e => setManualCase({...manualCase, citation: e.target.value})}
                                placeholder="2024 MLR 123"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Court</label>
                            <input 
                                className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar"
                                value={manualCase.court || ''}
                                onChange={e => setManualCase({...manualCase, court: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                            <input 
                                type="date"
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={manualCase.date || ''}
                                onChange={e => setManualCase({...manualCase, date: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                            <select 
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={manualCase.caseType}
                                onChange={e => setManualCase({...manualCase, caseType: e.target.value})}
                            >
                                <option value="Administrative">Administrative</option>
                                <option value="Land">Land</option>
                                <option value="Criminal">Criminal</option>
                                <option value="Civil">Civil</option>
                                <option value="Family">Family</option>
                                <option value="Constitutional">Constitutional</option>
                                <option value="Corporate">Corporate</option>
                                <option value="Maritime">Maritime</option>
                                <option value="Labor">Labor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Judges (Comma separated)</label>
                            <input 
                                className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar"
                                placeholder="U Htun, Daw Mya"
                                onChange={e => setManualCase({...manualCase, judges: e.target.value.split(',').map(s => s.trim())})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Full Content / Judgment Text *</label>
                        <textarea 
                            className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar h-40"
                            value={manualCase.content || ''}
                            onChange={e => setManualCase({...manualCase, content: e.target.value})}
                            placeholder="Paste the full judgment text here..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Summary (Optional)</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar h-20"
                                value={manualCase.summary || ''}
                                onChange={e => setManualCase({...manualCase, summary: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Holding (Optional)</label>
                            <textarea 
                                className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar h-20"
                                value={manualCase.holding || ''}
                                onChange={e => setManualCase({...manualCase, holding: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-between gap-3 border-t border-gray-100">
                        <button 
                            onClick={() => setShowManualModal(false)}
                            className="text-gray-500 font-bold text-sm hover:text-gray-700 px-4 py-2"
                        >
                            Cancel
                        </button>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => handleManualSave(false)}
                                className="border border-slate-900 text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-slate-50 transition text-sm flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Save & Add Another
                            </button>
                            <button 
                                onClick={() => handleManualSave(true)}
                                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition text-sm"
                            >
                                Save & Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Other tabs (Users, Inbox, etc.) remain the same... */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-slate-900">Registered Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Time Left</th>
                  <th className="px-6 py-3">Expiry Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => {
                  const daysLeft = getDaysRemaining(user.subscriptionExpiry);
                  const isExpired = daysLeft === 0;
                  const isBanned = user.isBanned;
                  const isEditing = editingUser === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 flex items-center gap-2">
                           {user.name}
                           <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
                        </div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'ADMIN' ? (
                          <span className="text-green-600 font-medium">System</span>
                        ) : isBanned ? (
                          <span className="text-red-600 font-bold flex items-center gap-1"><Ban className="w-3 h-3"/> REVOKED</span>
                        ) : isExpired ? (
                          <span className="text-orange-600 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Expired</span>
                        ) : (
                          <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'ADMIN' ? '∞' : (
                            <span className={`font-mono font-bold ${daysLeft < 7 ? 'text-red-500' : 'text-slate-700'}`}>
                                {daysLeft} Days
                            </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        {new Date(user.subscriptionExpiry).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== 'ADMIN' && (
                          <div className="flex justify-end items-center gap-2">
                            {isEditing ? (
                              <>
                                <select 
                                  value={extensionMonths}
                                  onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                                  className="border rounded px-2 py-1 text-xs"
                                >
                                  <option value={1}>+1 Mo</option>
                                  <option value={3}>+3 Mo</option>
                                  <option value={6}>+6 Mo</option>
                                  <option value={12}>+1 Yr</option>
                                </select>
                                <button onClick={() => handleExtendSubscription(user)} className="text-green-600 font-bold text-xs hover:underline">Save</button>
                                <button onClick={() => setEditingUser(null)} className="text-gray-400 text-xs hover:text-gray-600">Cancel</button>
                              </>
                            ) : (
                                <>
                                  <button 
                                    onClick={() => setEditingUser(user.id)}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1"
                                    title="Extend Subscription"
                                  >
                                    <Clock className="w-3 h-3" /> Extend
                                  </button>
                                  {!user.isBanned && (
                                      <button 
                                        onClick={() => handleBanUser(user)}
                                        className="text-red-500 hover:text-red-700 font-medium text-xs flex items-center gap-1"
                                        title="Revoke Access (Ban)"
                                      >
                                        <Ban className="w-3 h-3" /> Revoke
                                      </button>
                                  )}
                                </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'INBOX' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-gold-500" /> Customer Support Tickets
                </h3>
                <span className="text-xs text-gray-500">{tickets.length} messages</span>
            </div>
            <div className="divide-y divide-gray-100">
               {tickets.length === 0 && (
                   <div className="p-12 text-center text-gray-400">
                      <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No messages in inbox.</p>
                   </div>
               )}
               {tickets.map(ticket => (
                 <div key={ticket.id} className={`p-6 hover:bg-gray-50 transition border-l-4 ${ticket.status === 'OPEN' ? 'border-l-blue-500 bg-blue-50/10' : 'border-l-green-500'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {ticket.status}
                           </span>
                           <span className="text-xs font-bold text-gray-400 uppercase">{ticket.category}</span>
                           <span className="text-xs text-gray-400">• {new Date(ticket.date).toLocaleString()}</span>
                        </div>
                        <div className="flex gap-2">
                           {ticket.status === 'OPEN' && (
                               <button 
                                 onClick={(e) => handleResolveTicket(ticket.id, e)}
                                 className="text-green-600 hover:text-green-800 text-xs font-bold flex items-center gap-1"
                               >
                                  <Check className="w-3 h-3" /> Mark Resolved
                               </button>
                           )}
                           <button 
                             onClick={(e) => handleDeleteTicket(ticket.id, e)}
                             className="text-gray-400 hover:text-red-600 p-1"
                             title="Delete Message"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                    </div>
                    <h4 className="font-bold text-slate-900 mb-1 text-sm">{ticket.subject}</h4>
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">{ticket.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <div className="flex items-center gap-1">
                           <Users className="w-3 h-3" /> <span className="font-medium">{ticket.senderName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                           <Mail className="w-3 h-3" /> <span className="font-mono">{ticket.contactInfo}</span>
                        </div>
                    </div>
                 </div>
               ))}
            </div>
        </div>
      )}

      {activeTab === 'ANNOUNCEMENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <Megaphone className="w-5 h-5 text-gold-500" /> New Announcement
                </h3>
                <form onSubmit={handlePostAnnouncement} className="space-y-4">
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Title</label>
                      <input 
                         type="text" 
                         value={newAnnouncement.title}
                         onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                         className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                         placeholder="e.g., System Maintenance"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Type</label>
                      <select 
                         value={newAnnouncement.type}
                         onChange={(e) => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                         className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                      >
                         <option value="INFO">Information</option>
                         <option value="WARNING">Warning</option>
                         <option value="URGENT">Urgent</option>
                         <option value="SUCCESS">Success</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Message</label>
                      <textarea 
                         value={newAnnouncement.message}
                         onChange={(e) => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                         className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none h-32"
                         placeholder="Write your message here..."
                      />
                   </div>
                   <button 
                      type="submit"
                      className="w-full bg-slate-900 text-white py-2 rounded font-bold hover:bg-slate-800 transition"
                   >
                      Post Announcement
                   </button>
                </form>
             </div>
          </div>
          <div className="lg:col-span-2">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                   <h3 className="font-semibold text-slate-900">Active Announcements</h3>
                </div>
                <div className="divide-y divide-gray-100">
                   {announcements.length === 0 && (
                      <div className="p-8 text-center text-gray-400">No active announcements</div>
                   )}
                   {announcements.map(ann => (
                      <div key={ann.id} className="p-4 flex gap-4">
                         <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                             ann.type === 'URGENT' ? 'bg-red-100 text-red-600' :
                             ann.type === 'WARNING' ? 'bg-orange-100 text-orange-600' :
                             ann.type === 'SUCCESS' ? 'bg-green-100 text-green-600' :
                             'bg-blue-100 text-blue-600'
                         }`}>
                             <Bell className="w-4 h-4" />
                         </div>
                         <div className="flex-1">
                            <div className="flex justify-between items-start">
                               <div>
                                  <h4 className="font-bold text-slate-900">{ann.title}</h4>
                                  <span className="text-xs text-gray-500">{new Date(ann.date).toLocaleDateString()}</span>
                               </div>
                               <button 
                                  onClick={(e) => handleDeleteAnnouncement(ann.id, e)}
                                  className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                  title="Delete Announcement"
                               >
                                  <Trash2 className="w-4 h-4" />
                               </button>
                            </div>
                            <p className="text-gray-600 text-sm mt-1">{ann.message}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'SETTINGS' && (
        <div className="max-w-4xl mx-auto">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5" /> System Configuration
                </h2>
                
                <form onSubmit={handleConfigSave} className="space-y-8">
                    {/* Payment Config Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Payment Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* KBZ Pay */}
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                                <h3 className="font-bold text-blue-900 mb-4">KBZ Pay Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Account Name</label>
                                        <input 
                                            type="text" 
                                            value={config.kbz.name}
                                            onChange={(e) => setConfig({...config, kbz: { ...config.kbz, name: e.target.value }})}
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                                        <input 
                                            type="text" 
                                            value={config.kbz.phone}
                                            onChange={(e) => setConfig({...config, kbz: { ...config.kbz, phone: e.target.value }})}
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Wave Pay */}
                            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
                                <h3 className="font-bold text-yellow-900 mb-4">Wave Pay Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Account Name</label>
                                        <input 
                                            type="text" 
                                            value={config.wave.name}
                                            onChange={(e) => setConfig({...config, wave: { ...config.wave, name: e.target.value }})}
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                                        <input 
                                            type="text" 
                                            value={config.wave.phone}
                                            onChange={(e) => setConfig({...config, wave: { ...config.wave, phone: e.target.value }})}
                                            className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Config Section */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Customer Support Contact</h3>
                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                                      <Phone className="w-3 h-3" /> Support Phone
                                    </label>
                                    <input 
                                        type="text" 
                                        value={config.support?.phone || ''}
                                        onChange={(e) => setConfig({
                                          ...config, 
                                          support: { ...config.support, phone: e.target.value }
                                        })}
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                                        placeholder="09-123-456-789"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1">
                                      <Mail className="w-3 h-3" /> Support Email
                                    </label>
                                    <input 
                                        type="text" 
                                        value={config.support?.email || ''}
                                        onChange={(e) => setConfig({
                                          ...config, 
                                          support: { ...config.support, email: e.target.value }
                                        })}
                                        className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                                        placeholder="support@example.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        <span className="text-green-600 font-medium text-sm">{saveStatus}</span>
                        <button 
                            type="submit"
                            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition"
                        >
                            <Save className="w-4 h-4" /> Save Configuration
                        </button>
                    </div>
                </form>
             </div>
        </div>
      )}
    </div>
  );
};
