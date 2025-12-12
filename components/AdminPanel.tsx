
import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, Trash2, Database, Users, Calendar, Settings, Save, Ban, Clock, Bell, Megaphone, Phone, Mail, Inbox, MessageSquare, Check, Edit2, X, Plus, AlertTriangle, Sparkles, Clipboard, ArrowRight, Shield, Book, Languages, File, Zap, Eye } from 'lucide-react';
import { detectAndSplitCases, readFileAsText, readPdfFile, convertPdfToImages } from '../services/pdfProcessor';
import { extractCaseData, analyzeCitationNetwork, extractCaseFromImages } from '../services/geminiService';
import { saveCase, clearDatabase, getCases, getUsers, saveUser, getConfig, saveConfig, getAnnouncements, saveAnnouncement, deleteAnnouncement, getTickets, updateTicketStatus, deleteTicket, batchUpdateCaseStatuses, getStatutes, saveStatute, deleteStatute, getDictionaryTerms, saveDictionaryTerm, deleteDictionaryTerm, getTemplates, saveTemplate, deleteTemplate } from '../services/db';
import { UploadQueueItem, User, BillingConfig, Announcement, SupportTicket, LegalCase, CitationStatus, UserRole, Statute, DictionaryTerm, LegalTemplate } from '../types';

interface AdminPanelProps {
    currentUser?: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'DATABASE' | 'USERS' | 'INBOX' | 'ANNOUNCEMENTS' | 'SETTINGS' | 'RESOURCES'>('DATABASE');
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dbStats, setDbStats] = useState({ count: getCases().length });
  
  // Safe Mode Toggle (Default ON for free tier users)
  const [isSafeMode, setIsSafeMode] = useState(true);

  // Database Edit State
  const [allCases, setAllCases] = useState<LegalCase[]>([]);
  
  // Dynamic Categories for Edit
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Manual Entry / Full Edit State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCase, setManualCase] = useState<Partial<LegalCase>>({
      caseType: 'Civil',
      court: 'Supreme Court of the Union',
      judges: [],
      content: '',
      status: 'GOOD_LAW',
      brief: {
          facts: '',
          issues: [],
          holding: '',
          reasoning: '',
          principles: []
      }
  });

  // Paste & Analyze State
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  // Settings State
  const [config, setConfig] = useState<BillingConfig>(getConfig());
  const [saveStatus, setSaveStatus] = useState('');

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'INFO' as const });

  // Inbox State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // Resources State
  const [resourceSubTab, setResourceSubTab] = useState<'LEGISLATION' | 'DICTIONARY' | 'TEMPLATES'>('LEGISLATION');
  const [statutes, setStatutes] = useState<Statute[]>([]);
  const [dictTerms, setDictTerms] = useState<DictionaryTerm[]>([]);
  const [templates, setTemplates] = useState<LegalTemplate[]>([]);
  
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [newStatute, setNewStatute] = useState<Partial<Statute>>({});
  const [newDict, setNewDict] = useState<Partial<DictionaryTerm>>({});
  const [newTemplate, setNewTemplate] = useState<Partial<LegalTemplate>>({});

  // Check Permissions
  const isSuperAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    if (activeTab === 'DATABASE') {
        const cases = getCases();
        setAllCases(cases);
        setDbStats({ count: cases.length });
        
        // Extract unique categories for the datalist
        const cats = Array.from(new Set(cases.map(c => c.caseType).filter(Boolean))).sort();
        setAvailableCategories(cats);
    }
    // Only fetch other data if Super Admin
    if (isSuperAdmin) {
        if (activeTab === 'USERS') setUsers(getUsers());
        if (activeTab === 'SETTINGS') setConfig(getConfig());
        if (activeTab === 'ANNOUNCEMENTS') setAnnouncements(getAnnouncements());
        if (activeTab === 'INBOX') setTickets(getTickets());
        if (activeTab === 'RESOURCES') {
            setStatutes(getStatutes());
            setDictTerms(getDictionaryTerms(''));
            setTemplates(getTemplates());
        }
    }
  }, [activeTab, isSuperAdmin]);

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
        
        let cases: string[] = [];
        let useVision = false;

        // 1. Try Standard Text Extraction
        if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
          const rawText = await readPdfFile(file);
          
          // Heuristic: If text is extremely short or garbage, fallback to Vision
          if (rawText.trim().length < 200 || rawText.includes("")) {
             console.warn(`File ${file.name} yielded poor text. Switching to Vision Mode.`);
             useVision = true;
          } else {
             cases = await detectAndSplitCases(rawText);
          }
        } else {
          // Text files
          const text = await readFileAsText(file);
          cases = await detectAndSplitCases(text);
        }
        
        if (useVision) {
            // VISION MODE FALLBACK
            updateQueueStatus(queueId, 'PROCESSING', { error: "Scanning Images (OCR)..." });
            const images = await convertPdfToImages(file, 10); // Limit to 10 pages for safety
            
            // Send images to Gemini
            const extractedCases = await extractCaseFromImages(images, file.name);
            extractedCases.forEach(c => saveCase(c));
            
            updateQueueStatus(queueId, 'COMPLETED', { processedCases: extractedCases.length, totalCasesDetected: extractedCases.length });

        } else {
            // STANDARD TEXT MODE
            updateQueueStatus(queueId, 'PROCESSING', { totalCasesDetected: cases.length });

            for (let j = 0; j < cases.length; j++) {
                const delay = isSafeMode ? 30000 : 10000;
                if (j > 0) { 
                    await new Promise(r => setTimeout(r, delay)); 
                }
                
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
        }
        
        refreshStats();
        setAllCases(getCases()); 
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
      const cats = Array.from(new Set(c.map(item => item.caseType).filter(Boolean))).sort();
      setAvailableCategories(cats);
  };

  const handleResetDb = () => {
      if (confirm("Are you sure you want to reset the database? This cannot be undone.")) {
          clearDatabase();
          refreshStats();
      }
  };

  // --- Bulk Citation Analysis ---
  const handleAnalyzeCitations = async () => {
    if (allCases.length === 0) return;
    setIsAnalyzing(true);
    try {
        const updates = await analyzeCitationNetwork(allCases);
        batchUpdateCaseStatuses(updates);
        refreshStats();
        alert(`Analysis Complete: Updated statuses for ${updates.length} cases based on cross-referencing.`);
    } catch (e) {
        console.error(e);
        alert("Analysis failed. Please check API key limits.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  // --- Manual Entry / Full Edit Logic ---
  const handleManualSave = (closeAfterSave: boolean) => {
    if (!manualCase.caseName || !manualCase.citation || !manualCase.content) {
        alert("Please fill in at least Case Name, Citation, and Content.");
        return;
    }

    const newCase: LegalCase = {
        id: manualCase.id || `manual-${Date.now()}`,
        caseName: manualCase.caseName,
        caseNameEnglish: manualCase.caseNameEnglish || '',
        citation: manualCase.citation,
        court: manualCase.court || 'Supreme Court',
        judges: typeof manualCase.judges === 'string' ? (manualCase.judges as string).split(',').map((j: string) => j.trim()) : manualCase.judges || [],
        date: manualCase.date || new Date().toISOString().split('T')[0],
        caseType: manualCase.caseType || 'Civil',
        content: manualCase.content,
        summary: manualCase.summary || '',
        holding: manualCase.holding || '',
        legalIssues: typeof manualCase.legalIssues === 'string' ? (manualCase.legalIssues as string).split('\n').filter((l: string) => l.trim()) : manualCase.legalIssues || [],
        parties: manualCase.parties || {},
        extractionDate: manualCase.extractionDate || new Date().toISOString(),
        sourcePdfName: manualCase.sourcePdfName || 'Manual Entry',
        extractionConfidence: manualCase.extractionConfidence || 100,
        extractedSuccessfully: true,
        headnotes: typeof manualCase.headnotes === 'string' ? (manualCase.headnotes as string).split('\n').filter((h: string) => h.trim()) : manualCase.headnotes || [],
        status: manualCase.status || 'GOOD_LAW',
        brief: manualCase.brief ? {
            facts: manualCase.brief.facts || '',
            issues: Array.isArray(manualCase.brief.issues) ? manualCase.brief.issues : (manualCase.brief.issues as string || '').split('\n').filter((i: string) => i.trim()),
            holding: manualCase.brief.holding || '',
            reasoning: manualCase.brief.reasoning || '',
            principles: Array.isArray(manualCase.brief.principles) ? manualCase.brief.principles : (manualCase.brief.principles as string || '').split('\n').filter((p: string) => p.trim())
        } : undefined
    };

    saveCase(newCase);
    refreshStats();
    
    if (closeAfterSave) {
        setShowManualModal(false);
    }
    
    // If creating new, reset. If editing, keep modal open if not closed.
    if (!manualCase.id && !closeAfterSave) {
        setManualCase({
            caseType: 'Civil',
            court: 'Supreme Court of the Union',
            judges: [],
            content: '',
            status: 'GOOD_LAW',
            brief: { facts: '', issues: [], holding: '', reasoning: '', principles: [] }
        });
        alert("Case saved. Ready for next entry.");
    } else if (manualCase.id && !closeAfterSave) {
        alert("Case updated.");
    }
  };

  const handlePasteAnalyze = async () => {
      if (!pasteText.trim()) return;
      setIsAnalyzingText(true);
      try {
          // Use the existing extraction service
          const extracted = await extractCaseData(pasteText, 'Pasted Text', 0);
          
          // Populate the manual entry modal with the result
          setManualCase({
              ...extracted,
              content: pasteText // Keep original text if extraction cleaned it, or use extracted.cleanedContent if service provided it
          });
          
          setPasteText('');
          setShowPasteModal(false);
          setShowManualModal(true);
      } catch (err) {
          alert("Analysis failed. Please try again or fill manually.");
          console.error(err);
      } finally {
          setIsAnalyzingText(false);
      }
  };

  // --- Database Editing Logic ---
  const startEditCase = (c: LegalCase) => {
    setManualCase({ ...c }); // Clone full object
    setShowManualModal(true);
  };

  const deleteCase = (id: string) => {
    if(confirm("Delete this case?")) {
       const updatedCases = allCases.filter(c => c.id !== id);
       localStorage.setItem("myanlex_cases", JSON.stringify(updatedCases));
       setAllCases(updatedCases);
       setDbStats({ count: updatedCases.length });
    }
  };

  // --- User Editing Logic ---
  const handleEditUser = (u: User) => {
      setEditingUser(u);
      setShowUserModal(true);
  };

  const saveUserChanges = () => {
      if (!editingUser.id) return;
      saveUser(editingUser as User);
      setUsers(getUsers());
      setShowUserModal(false);
  };

  // --- Resource Management Logic ---
  const handleSaveResource = () => {
      if (resourceSubTab === 'LEGISLATION') {
          const s = newStatute as Statute;
          if(!s.title) return;
          saveStatute({...s, id: s.id || `st-${Date.now()}`});
          setStatutes(getStatutes());
          setNewStatute({});
      } else if (resourceSubTab === 'DICTIONARY') {
          const d = newDict as DictionaryTerm;
          if(!d.term) return;
          saveDictionaryTerm({...d, id: d.id || `dt-${Date.now()}`});
          setDictTerms(getDictionaryTerms(''));
          setNewDict({});
      } else {
          const t = newTemplate as LegalTemplate;
          if(!t.title) return;
          saveTemplate({...t, id: t.id || `tmp-${Date.now()}`});
          setTemplates(getTemplates());
          setNewTemplate({});
      }
      setShowResourceModal(false);
  };

  const handleDeleteResource = (id: string) => {
      if(!confirm("Delete this resource?")) return;
      if (resourceSubTab === 'LEGISLATION') {
          deleteStatute(id);
          setStatutes(getStatutes());
      } else if (resourceSubTab === 'DICTIONARY') {
          deleteDictionaryTerm(id);
          setDictTerms(getDictionaryTerms(''));
      } else {
          deleteTemplate(id);
          setTemplates(getTemplates());
      }
  };

  // --- Settings & Announcements Logic ---
  const handleSaveConfig = () => {
      saveConfig(config);
      setSaveStatus('Settings Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
  };

  const handlePostAnnouncement = () => {
      if (!newAnnouncement.title || !newAnnouncement.message) return;
      const ann: Announcement = {
          id: Date.now().toString(),
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          type: newAnnouncement.type,
          date: new Date().toISOString(),
          isActive: true
      };
      saveAnnouncement(ann);
      setAnnouncements(getAnnouncements());
      setNewAnnouncement({ title: '', message: '', type: 'INFO' });
  };

  const handleDeleteAnnouncement = (id: string) => {
      deleteAnnouncement(id);
      setAnnouncements(getAnnouncements());
  };

  // --- Inbox Logic ---
  const handleTicketAction = (id: string, action: 'RESOLVE' | 'DELETE') => {
      if (action === 'RESOLVE') {
          updateTicketStatus(id, 'RESOLVED');
      } else {
          deleteTicket(id);
      }
      setTickets(getTickets());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-myanmar">
      {/* Header and Tab Navigation */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-serif font-bold text-slate-900 flex items-center gap-2">
            <Database className="text-gold-500" /> 
            {currentUser?.role === 'EDITOR' ? 'Editor Panel' : 'Admin Panel'}
        </h1>
        
        {/* Only show tabs if Super Admin. Editors are locked to Database. */}
        {isSuperAdmin ? (
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('DATABASE')}
                className={`px-4 py-2 rounded font-medium text-sm whitespace-nowrap transition ${activeTab === 'DATABASE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-50'}`}
            >
                Database
            </button>
            <button 
                onClick={() => setActiveTab('RESOURCES')}
                className={`px-4 py-2 rounded font-medium text-sm whitespace-nowrap transition ${activeTab === 'RESOURCES' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-gray-50'}`}
            >
                Resources
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
        ) : (
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                Database Access Only
            </div>
        )}
      </div>

      {activeTab === 'DATABASE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-slate-900">Manage Cases</h3>
                <div className="flex gap-2">
                    <button 
                    onClick={() => setShowPasteModal(true)}
                    className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-200 transition shadow-sm text-sm"
                    >
                        <Clipboard className="w-4 h-4" /> AI Import
                    </button>
                    <button 
                    onClick={() => {
                        setManualCase({
                            caseType: 'Civil', court: 'Supreme Court', judges: [], content: '', status: 'GOOD_LAW',
                            brief: { facts: '', issues: [], holding: '', reasoning: '', principles: [] }
                        });
                        setShowManualModal(true);
                    }}
                    className="bg-gold-500 text-slate-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition shadow-sm text-sm"
                    >
                        <Plus className="w-4 h-4" /> New Case
                    </button>
                </div>
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
              <p className="text-gray-500 mb-4 text-sm">Supported: PDF, TXT</p>
              
              {/* Safe Mode Toggle */}
              <div className="flex items-center justify-center gap-2 mb-6">
                  <label className="flex items-center cursor-pointer relative">
                      <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={isSafeMode}
                          onChange={() => setIsSafeMode(!isSafeMode)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700 flex items-center gap-1">
                          {isSafeMode ? 'Safe Mode (Free Tier)' : 'Fast Mode (Paid Key)'} 
                          {isSafeMode && <Shield className="w-3 h-3 text-green-500" />}
                          {!isSafeMode && <Zap className="w-3 h-3 text-gold-500" />}
                      </span>
                  </label>
              </div>

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
                                {item.error && item.error.includes("Scanning Images") ? (
                                    <Eye className="h-5 w-5 text-blue-500 animate-pulse" />
                                ) : (
                                    <FileText className="h-5 w-5 text-slate-400" />
                                )}
                                <div>
                                    <div className="font-medium text-slate-900 text-sm">{item.fileName}</div>
                                    <div className="text-xs text-gray-500">
                                        {item.status}
                                        {item.error ? <span className="text-blue-600 font-bold ml-1">{item.error}</span> : item.status === 'PROCESSING' && ` (${item.processedCases}/${item.totalCasesDetected || '?'})`}
                                    </div>
                                </div>
                            </div>
                            <div>
                                {item.status === 'PROCESSING' && <RefreshCw className="h-5 w-5 text-gold-500 animate-spin" />}
                                {item.status === 'COMPLETED' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                {item.status === 'ERROR' && !item.error?.includes("Scanning") && <AlertCircle className="h-5 w-5 text-red-500" />}
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
                                    <th className="px-4 py-2">Citation</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {allCases.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-myanmar">
                                            <div className="font-medium text-slate-900 line-clamp-1">{c.caseName}</div>
                                            <div className="text-xs text-gray-400">{c.caseType}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs">{c.citation}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {c.status === 'GOOD_LAW' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                                {c.status === 'OVERRULED' && <Ban className="w-4 h-4 text-red-500" />}
                                                {(c.status === 'CAUTION' || c.status === 'DISTINGUISHED') && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                                <span className="text-xs font-bold text-slate-700">{c.status?.replace('_', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 flex gap-2">
                                            <button onClick={() => startEditCase(c)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-1.5 rounded"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => deleteCase(c.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

          </div>
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-slate-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                      <button 
                         onClick={handleAnalyzeCitations}
                         disabled={isAnalyzing}
                         className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-900 font-bold p-3 rounded hover:bg-slate-200 transition text-sm disabled:opacity-50"
                      >
                          {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-gold-600" />}
                          {isAnalyzing ? "Analyzing Network..." : "AI Citation Check"}
                      </button>
                      <button onClick={handleResetDb} className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 p-2 rounded hover:bg-red-50 transition text-sm">
                          <Trash2 className="h-4 w-4" /> Reset Database
                      </button>
                  </div>
              </div>
          </div>
        </div>
      )}

      {/* --- USERS TAB --- */}
      {/* ... (Existing Users, Inbox, Announcement, Settings, Resources Tabs code remains unchanged) ... */}
      
      {/* (Truncating for brevity as the only changes were in the DATABASE tab's file processing logic above. The rest of the file content for other tabs should be kept exactly as provided in the original input to ensure integrity.) */}
      
      {activeTab === 'USERS' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900">User Accounts</h3>
                  <div className="text-xs text-gray-500">{users.length} total users</div>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500">
                          <tr>
                              <th className="px-6 py-3">User</th>
                              <th className="px-6 py-3">Role</th>
                              <th className="px-6 py-3">Status</th>
                              <th className="px-6 py-3">Expiry</th>
                              <th className="px-6 py-3">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {users.map(u => (
                              <tr key={u.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">
                                      <div className="font-bold text-slate-900">{u.name}</div>
                                      <div className="text-xs text-gray-500">{u.email}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-700 uppercase">{u.role}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                      {u.isBanned ? (
                                          <span className="text-red-500 flex items-center gap-1 font-bold text-xs"><Ban className="w-3 h-3" /> Banned</span>
                                      ) : (
                                          <span className="text-green-500 flex items-center gap-1 font-bold text-xs"><CheckCircle className="w-3 h-3" /> Active</span>
                                      )}
                                  </td>
                                  <td className="px-6 py-4 text-xs text-gray-500">
                                      {new Date(u.subscriptionExpiry).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4">
                                      <button onClick={() => handleEditUser(u)} className="text-blue-600 hover:underline text-xs font-bold">Edit</button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* --- INBOX TAB --- */}
      {activeTab === 'INBOX' && (
          <div className="grid gap-4">
              {tickets.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                      <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No support tickets yet.</p>
                  </div>
              ) : (
                  tickets.map(t => (
                      <div key={t.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.category === 'BILLING' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {t.category}
                                      </span>
                                      <span className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</span>
                                  </div>
                                  <h3 className="font-bold text-lg text-slate-900">{t.subject}</h3>
                                  <div className="text-sm text-gray-500 mt-1">From: {t.senderName} ({t.contactInfo})</div>
                              </div>
                              <div className="flex items-center gap-2">
                                  {t.status === 'OPEN' ? (
                                      <button onClick={() => handleTicketAction(t.id, 'RESOLVE')} className="bg-green-50 text-green-600 px-3 py-1 rounded text-xs font-bold hover:bg-green-100">
                                          Mark Resolved
                                      </button>
                                  ) : (
                                      <span className="text-gray-400 text-xs font-bold flex items-center gap-1"><Check className="w-3 h-3" /> Resolved</span>
                                  )}
                                  <button onClick={() => handleTicketAction(t.id, 'DELETE')} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 border border-gray-100">
                              {t.message}
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}

      {/* --- ANNOUNCEMENTS TAB --- */}
      {activeTab === 'ANNOUNCEMENTS' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Megaphone className="w-5 h-5 text-gold-500" /> New Post
                      </h3>
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Title</label>
                              <input 
                                  className="w-full border border-gray-300 rounded p-2 text-sm"
                                  value={newAnnouncement.title}
                                  onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Type</label>
                              <select 
                                  className="w-full border border-gray-300 rounded p-2 text-sm"
                                  value={newAnnouncement.type}
                                  onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                              >
                                  <option value="INFO">Info</option>
                                  <option value="WARNING">Warning</option>
                                  <option value="URGENT">Urgent</option>
                                  <option value="SUCCESS">Success</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Message</label>
                              <textarea 
                                  className="w-full border border-gray-300 rounded p-2 text-sm h-32"
                                  value={newAnnouncement.message}
                                  onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                              />
                          </div>
                          <button 
                              onClick={handlePostAnnouncement}
                              className="w-full bg-slate-900 text-white font-bold py-2 rounded hover:bg-slate-800 transition"
                          >
                              Post Announcement
                          </button>
                      </div>
                  </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                  {announcements.map(ann => (
                      <div key={ann.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex justify-between items-start">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                      ann.type === 'URGENT' ? 'bg-red-100 text-red-600' : 
                                      ann.type === 'WARNING' ? 'bg-orange-100 text-orange-600' : 
                                      'bg-blue-100 text-blue-600'
                                  }`}>
                                      {ann.type}
                                  </span>
                                  <span className="text-xs text-gray-400">{new Date(ann.date).toLocaleDateString()}</span>
                              </div>
                              <h4 className="font-bold text-slate-900">{ann.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{ann.message}</p>
                          </div>
                          <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-red-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- SETTINGS TAB --- */}
      {activeTab === 'SETTINGS' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
              <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-gray-400" /> Platform Configuration
              </h3>
              
              <div className="space-y-8">
                  <div>
                      <h4 className="font-bold text-sm text-blue-900 uppercase mb-4 pb-2 border-b border-blue-100">KBZ Pay Info</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Account Name</label>
                              <input className="w-full border rounded p-2 text-sm" value={config.kbz.name} onChange={e => setConfig({...config, kbz: {...config.kbz, name: e.target.value}})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                              <input className="w-full border rounded p-2 text-sm" value={config.kbz.phone} onChange={e => setConfig({...config, kbz: {...config.kbz, phone: e.target.value}})} />
                          </div>
                      </div>
                  </div>

                  <div>
                      <h4 className="font-bold text-sm text-yellow-600 uppercase mb-4 pb-2 border-b border-yellow-100">Wave Pay Info</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Account Name</label>
                              <input className="w-full border rounded p-2 text-sm" value={config.wave.name} onChange={e => setConfig({...config, wave: {...config.wave, name: e.target.value}})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Phone Number</label>
                              <input className="w-full border rounded p-2 text-sm" value={config.wave.phone} onChange={e => setConfig({...config, wave: {...config.wave, phone: e.target.value}})} />
                          </div>
                      </div>
                  </div>

                  <div>
                      <h4 className="font-bold text-sm text-slate-500 uppercase mb-4 pb-2 border-b border-slate-100">Support Contact</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Phone</label>
                              <input className="w-full border rounded p-2 text-sm" value={config.support.phone} onChange={e => setConfig({...config, support: {...config.support, phone: e.target.value}})} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
                              <input className="w-full border rounded p-2 text-sm" value={config.support.email} onChange={e => setConfig({...config, support: {...config.support, email: e.target.value}})} />
                          </div>
                      </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-green-600 font-bold text-sm">{saveStatus}</span>
                      <button 
                          onClick={handleSaveConfig}
                          className="bg-slate-900 text-white px-8 py-2 rounded-lg font-bold hover:bg-slate-800 transition"
                      >
                          Save Changes
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- RESOURCES TAB --- */}
      {activeTab === 'RESOURCES' && (
          <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setResourceSubTab('LEGISLATION')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${resourceSubTab === 'LEGISLATION' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          Legislation
                      </button>
                      <button 
                        onClick={() => setResourceSubTab('DICTIONARY')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${resourceSubTab === 'DICTIONARY' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          Dictionary
                      </button>
                      <button 
                        onClick={() => setResourceSubTab('TEMPLATES')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${resourceSubTab === 'TEMPLATES' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          Templates
                      </button>
                  </div>
                  <button 
                    onClick={() => setShowResourceModal(true)}
                    className="bg-gold-500 text-slate-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition shadow-sm text-sm"
                  >
                      <Plus className="w-4 h-4" /> Add {resourceSubTab.charAt(0) + resourceSubTab.slice(1).toLowerCase()}
                  </button>
              </div>

              {resourceSubTab === 'LEGISLATION' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 font-bold text-slate-900">Manage Statutes</div>
                      <div className="divide-y divide-gray-100">
                          {statutes.map(item => (
                              <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                  <div>
                                      <div className="font-bold text-slate-900">{item.title}</div>
                                      <div className="text-sm text-gray-500 font-myanmar">{item.titleMm} ({item.year})</div>
                                  </div>
                                  <button onClick={() => handleDeleteResource(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {resourceSubTab === 'DICTIONARY' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 font-bold text-slate-900">Manage Glossary</div>
                      <div className="divide-y divide-gray-100">
                          {dictTerms.map(item => (
                              <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                  <div>
                                      <div className="font-bold text-slate-900">{item.term}</div>
                                      <div className="text-sm text-gray-500 font-myanmar">{item.definitionMm}</div>
                                  </div>
                                  <button onClick={() => handleDeleteResource(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {resourceSubTab === 'TEMPLATES' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-4 border-b border-gray-100 font-bold text-slate-900">Manage Templates</div>
                      <div className="divide-y divide-gray-100">
                          {templates.map(item => (
                              <div key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                  <div>
                                      <div className="font-bold text-slate-900">{item.title}</div>
                                      <div className="text-sm text-gray-500">{item.category} • {item.format}</div>
                                  </div>
                                  <button onClick={() => handleDeleteResource(item.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* PASTE & ANALYZE MODAL */}
      {showPasteModal && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative">
                  <button onClick={() => setShowPasteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                      <X className="h-6 w-6" />
                  </button>
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Clipboard className="w-5 h-5 text-gold-500" /> AI Case Import
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                      Paste the raw text below. AI will clean encoding, extract citation/metadata, and generate a brief automatically.
                  </p>
                  
                  <textarea 
                      className="w-full h-80 border border-gray-300 rounded-lg p-4 font-myanmar text-sm focus:ring-2 focus:ring-gold-500 outline-none"
                      placeholder="Paste judgment text here..."
                      value={pasteText}
                      onChange={e => setPasteText(e.target.value)}
                  ></textarea>

                  <div className="mt-6 flex justify-end gap-3">
                      <button 
                          onClick={() => setShowPasteModal(false)}
                          className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handlePasteAnalyze}
                          disabled={isAnalyzingText || !pasteText.trim()}
                          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                          {isAnalyzingText ? (
                              <>
                                  <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...
                              </>
                          ) : (
                              <>
                                  Process Text <ArrowRight className="w-4 h-4" />
                              </>
                          )}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Manual Entry / Edit Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-0 relative max-h-[95vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-gold-500" /> {manualCase.id ? "Edit Case Record" : "New Case Entry"}
                    </h3>
                    <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 font-myanmar">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* LEFT COLUMN: Metadata & Content */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Case Metadata</h4>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Case Name (Myanmar)</label>
                                <input 
                                    className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar"
                                    value={manualCase.caseName || ''}
                                    onChange={e => setManualCase({...manualCase, caseName: e.target.value})}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Citation</label>
                                    <input 
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                        value={manualCase.citation || ''}
                                        onChange={e => setManualCase({...manualCase, citation: e.target.value})}
                                        placeholder="2021 MLR 1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                                    <input 
                                        type="date"
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                        value={manualCase.date || ''}
                                        onChange={e => setManualCase({...manualCase, date: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                                    <input 
                                        list="categories"
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                        value={manualCase.caseType}
                                        onChange={e => setManualCase({...manualCase, caseType: e.target.value})}
                                    />
                                    <datalist id="categories">
                                        {availableCategories.map(cat => <option key={cat} value={cat} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded p-2 text-sm"
                                        value={manualCase.status}
                                        onChange={e => setManualCase({...manualCase, status: e.target.value as CitationStatus})}
                                    >
                                        <option value="GOOD_LAW">Good Law</option>
                                        <option value="CAUTION">Caution</option>
                                        <option value="OVERRULED">Overruled</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Judges (Comma separated)</label>
                                <input 
                                    className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar"
                                    value={Array.isArray(manualCase.judges) ? manualCase.judges.join(', ') : manualCase.judges}
                                    onChange={e => setManualCase({...manualCase, judges: e.target.value.split(',').map(s => s.trim())})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Full Judgment Text *</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar h-64 leading-loose"
                                    value={manualCase.content || ''}
                                    onChange={e => setManualCase({...manualCase, content: e.target.value})}
                                    placeholder="Paste full text here..."
                                />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Briefing */}
                        <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Case Brief</h4>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Summary (Short)</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar h-20"
                                    value={manualCase.summary || ''}
                                    onChange={e => setManualCase({...manualCase, summary: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Facts</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar h-24"
                                    value={manualCase.brief?.facts || ''}
                                    onChange={e => setManualCase({...manualCase, brief: {...manualCase.brief!, facts: e.target.value}})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Issues (One per line)</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar h-24"
                                    value={Array.isArray(manualCase.brief?.issues) ? manualCase.brief?.issues.join('\n') : manualCase.brief?.issues}
                                    onChange={e => setManualCase({...manualCase, brief: {...manualCase.brief!, issues: e.target.value.split('\n')}})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Holding</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar h-20"
                                    value={manualCase.brief?.holding || manualCase.holding || ''}
                                    onChange={e => setManualCase({...manualCase, holding: e.target.value, brief: {...manualCase.brief!, holding: e.target.value}})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Reasoning</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded p-2 text-sm font-myanmar h-32"
                                    value={manualCase.brief?.reasoning || ''}
                                    onChange={e => setManualCase({...manualCase, brief: {...manualCase.brief!, reasoning: e.target.value}})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                    <button 
                        onClick={() => setShowManualModal(false)}
                        className="text-gray-500 font-bold text-sm hover:text-gray-700 px-4 py-2"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => handleManualSave(true)}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition text-sm flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Save Record
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* User Edit Modal & Resource Modal - no changes needed, truncated for conciseness in this file block if needed, but keeping full for safety */}
      {/* ... keeping previous implementations for modals ... */}
      {/* User Edit Modal */}
      {showUserModal && editingUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
                <button onClick={() => setShowUserModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                </button>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gold-500" /> Edit User
                </h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Full Name</label>
                        <input 
                            className="w-full border border-gray-300 rounded p-2 text-sm"
                            value={editingUser.name || ''}
                            onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Email Address</label>
                        <input 
                            className="w-full border border-gray-300 rounded p-2 text-sm"
                            value={editingUser.email || ''}
                            onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Role</label>
                            <select 
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                                value={editingUser.role || 'USER'}
                                onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                            >
                                <option value="USER">User</option>
                                <option value="EDITOR">Editor</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Status</label>
                            <button 
                                onClick={() => setEditingUser({...editingUser, isBanned: !editingUser.isBanned})}
                                className={`w-full p-2 rounded text-sm font-bold border transition ${editingUser.isBanned ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}
                            >
                                {editingUser.isBanned ? 'Banned' : 'Active'}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                        <button 
                            onClick={() => setShowUserModal(false)}
                            className="text-gray-500 font-bold text-sm hover:text-gray-700 px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={saveUserChanges}
                            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition text-sm"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Resource Add/Edit Modal */}
      {showResourceModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
                  <button onClick={() => setShowResourceModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                      <X className="h-6 w-6" />
                  </button>
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-gold-500" /> Add {resourceSubTab === 'LEGISLATION' ? 'Statute' : resourceSubTab === 'DICTIONARY' ? 'Term' : 'Template'}
                  </h3>

                  <div className="space-y-4">
                      {resourceSubTab === 'LEGISLATION' && (
                          <>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Title (English)</label>
                                  <input className="w-full border rounded p-2 text-sm" value={newStatute.title || ''} onChange={e => setNewStatute({...newStatute, title: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Title (Myanmar)</label>
                                  <input className="w-full border rounded p-2 text-sm font-myanmar" value={newStatute.titleMm || ''} onChange={e => setNewStatute({...newStatute, titleMm: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Year</label>
                                      <input className="w-full border rounded p-2 text-sm" value={newStatute.year || ''} onChange={e => setNewStatute({...newStatute, year: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                                      <input className="w-full border rounded p-2 text-sm" value={newStatute.category || ''} onChange={e => setNewStatute({...newStatute, category: e.target.value})} />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                                  <textarea className="w-full border rounded p-2 text-sm h-24" value={newStatute.description || ''} onChange={e => setNewStatute({...newStatute, description: e.target.value})} />
                              </div>
                          </>
                      )}

                      {resourceSubTab === 'DICTIONARY' && (
                          <>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Term</label>
                                  <input className="w-full border rounded p-2 text-sm font-bold" value={newDict.term || ''} onChange={e => setNewDict({...newDict, term: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Definition (Myanmar)</label>
                                  <textarea className="w-full border rounded p-2 text-sm font-myanmar h-20" value={newDict.definitionMm || ''} onChange={e => setNewDict({...newDict, definitionMm: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Definition (English)</label>
                                  <textarea className="w-full border rounded p-2 text-sm h-20" value={newDict.definitionEn || ''} onChange={e => setNewDict({...newDict, definitionEn: e.target.value})} />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                                  <input className="w-full border rounded p-2 text-sm" value={newDict.category || ''} onChange={e => setNewDict({...newDict, category: e.target.value})} />
                              </div>
                          </>
                      )}

                      {resourceSubTab === 'TEMPLATES' && (
                          <>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Title</label>
                                  <input className="w-full border rounded p-2 text-sm" value={newTemplate.title || ''} onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Category</label>
                                      <input className="w-full border rounded p-2 text-sm" value={newTemplate.category || ''} onChange={e => setNewTemplate({...newTemplate, category: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-gray-500 mb-1">Format</label>
                                      <select className="w-full border rounded p-2 text-sm" value={newTemplate.format || 'DOCX'} onChange={e => setNewTemplate({...newTemplate, format: e.target.value as 'DOCX' | 'PDF'})}>
                                          <option value="DOCX">DOCX</option>
                                          <option value="PDF">PDF</option>
                                      </select>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
                                  <textarea className="w-full border rounded p-2 text-sm h-24" value={newTemplate.description || ''} onChange={e => setNewTemplate({...newTemplate, description: e.target.value})} />
                              </div>
                          </>
                      )}
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                      <button 
                          onClick={() => setShowResourceModal(false)}
                          className="text-gray-500 font-bold text-sm hover:text-gray-700 px-4 py-2"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={handleSaveResource}
                          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition text-sm"
                      >
                          Save
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
