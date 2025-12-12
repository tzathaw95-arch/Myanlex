
import React, { useState, useEffect, useMemo } from 'react';
import { LegalCase, User } from '../types';
import { Book, ChevronRight, Bookmark, Filter, SlidersHorizontal, FolderPlus, Folder, AlertTriangle, CheckCircle, Ban, ArrowLeft, BrainCircuit, Scale, ArrowRightLeft, Sparkles, Layers, ChevronDown, X } from 'lucide-react';
import { getCases } from '../services/db';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchResultsProps {
  cases: LegalCase[];
  query: string;
  onSelectCase: (c: LegalCase) => void;
  savedCaseIds: string[]; // This is now legacy/derived
  onToggleSave: (id: string) => void; // Legacy toggle
  isSavedView: boolean;
  // New Props for Folder Management
  user?: User | null;
  onFolderUpdate?: () => void;
  // New Props for Multi-Analysis
  onAnalyze?: (selectedIds: string[], mode: 'POINTS' | 'CONTRADICTIONS' | 'SIMILARITY' | 'CUSTOM') => void;
}

interface CaseCardProps {
    c: LegalCase;
    saved: boolean;
    isSelected: boolean;
    onSelectCase: (c: LegalCase) => void;
    onToggleSave: (id: string) => void;
    toggleAnalysisSelection: (id: string) => void;
    getTrans: (key: string) => string;
}

const CaseCard: React.FC<CaseCardProps> = ({ c, saved, isSelected, onSelectCase, onToggleSave, toggleAnalysisSelection, getTrans }) => {
    const { t } = useLanguage();
    
    let StatusIcon = CheckCircle;
    let statusColor = "text-green-600 bg-green-50 border-green-200";
    let statusText = getTrans('GOOD_LAW');

    if (c.status === 'OVERRULED') {
        StatusIcon = Ban;
        statusColor = "text-red-600 bg-red-50 border-red-200";
        statusText = getTrans('OVERRULED');
    } else if (c.status === 'DISTINGUISHED' || c.status === 'CAUTION') {
        StatusIcon = AlertTriangle;
        statusColor = "text-yellow-600 bg-yellow-50 border-yellow-200";
        statusText = getTrans('CAUTION');
    }

    return (
      <div 
        className={`bg-white p-8 rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-300 group relative border ${isSelected ? 'border-gold-500 ring-1 ring-gold-500' : 'border-gray-100 hover:border-gold-200'}`}
      >
        {/* Card Accent */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl transition-colors duration-300 ${isSelected ? 'bg-gold-500' : 'bg-slate-200 group-hover:bg-gold-500'}`}></div>

        <div className="pl-4 flex gap-4">
            {/* Selection Checkbox */}
            <div className="pt-1">
                <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => toggleAnalysisSelection(c.id)}
                    className="w-5 h-5 cursor-pointer accent-gold-600"
                    title="Select for Multi-Case Analysis"
                />
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded border border-slate-200 font-mono">
                          {c.citation}
                      </span>
                      
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColor}`}>
                          <StatusIcon className="w-3 h-3" /> {statusText}
                      </span>

                      <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                          c.caseType === 'Criminal' ? 'text-red-600' :
                          c.caseType === 'Land' ? 'text-green-600' :
                          c.caseType === 'Administrative' ? 'text-purple-600' :
                          'text-gold-600'
                      }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                              c.caseType === 'Criminal' ? 'bg-red-500' :
                              c.caseType === 'Land' ? 'bg-green-500' :
                              c.caseType === 'Administrative' ? 'bg-purple-500' :
                              'bg-gold-500'
                          }`}></span>
                          {getTrans(c.caseType)}
                      </span>
                  </div>
                  <button 
                      onClick={(e) => { e.stopPropagation(); onToggleSave(c.id); }}
                      className={`transition p-2 rounded-full hover:bg-gray-100 flex items-center gap-2 ${saved ? 'text-gold-500 fill-current' : 'text-gray-300 hover:text-gold-500'}`}
                      title="Save / Manage Folders"
                  >
                      <Bookmark className={`h-5 w-5 ${saved ? 'fill-gold-500' : ''}`} />
                  </button>
                </div>

                <div onClick={() => onSelectCase(c)} className="cursor-pointer">
                    <h3 className="text-xl md:text-2xl text-slate-900 group-hover:text-blue-900 mb-2 font-bold font-myanmar leading-snug">
                      {c.caseName}
                    </h3>
                    {c.caseNameEnglish && (
                      <p className="text-sm text-slate-500 mb-4 italic font-serif">{c.caseNameEnglish}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500 mb-5 font-medium border-y border-gray-50 py-3">
                      <span className="flex items-center gap-1">
                          <span className="text-gray-400">Court:</span> <span className="text-slate-800 font-myanmar">{c.court}</span>
                      </span>
                      <span className="flex items-center gap-1">
                          <span className="text-gray-400">Date:</span> <span className="text-slate-800">{c.date || 'N/A'}</span>
                      </span>
                      {c.judges && c.judges.length > 0 && (
                          <span className="flex items-center gap-1">
                              <span className="text-gray-400">Judge:</span> <span className="text-slate-800 font-myanmar">{c.judges[0]}</span>
                          </span>
                      )}
                    </div>

                    <p className="text-gray-600 line-clamp-3 mb-6 text-sm leading-7 font-myanmar">
                      {c.summary || c.content.substring(0, 300) + "..."}
                    </p>

                    <div className="flex items-center text-gold-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                      {t('read_full')} <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
};

export const SearchResults: React.FC<SearchResultsProps> = ({ cases, query, onSelectCase, savedCaseIds, onToggleSave, isSavedView, user, onFolderUpdate, onAnalyze }) => {
  const { t, language } = useLanguage();
  
  // Folder Navigation State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [viewableCases, setViewableCases] = useState<LegalCase[]>(cases);

  // Grouping State
  const [groupBy, setGroupBy] = useState<'NONE' | 'COURT' | 'YEAR' | 'TYPE'>('NONE');

  // Multi-Selection State
  const [selectedForAnalysis, setSelectedForAnalysis] = useState<string[]>([]);

  // Dynamic Categories State
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  // Filter State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  // Helper to translate Categories and Status
  const getTrans = (key: string) => {
      // Map basic English categories to translation keys
      if (key === 'Administrative') return t('cat_admin');
      if (key === 'Land') return t('cat_land');
      if (key === 'Criminal') return t('cat_crim');
      if (key === 'Civil') return t('cat_civil');
      if (key === 'Family') return t('cat_fam');
      if (key === 'Constitutional') return t('cat_const');
      if (key === 'Corporate') return t('cat_corp');
      if (key === 'Labor') return t('cat_labor');
      if (key === 'Maritime') return t('cat_maritime');
      if (key === 'GOOD_LAW') return t('status_good');
      if (key === 'CAUTION' || key === 'DISTINGUISHED') return t('status_caution');
      if (key === 'OVERRULED') return t('status_overruled');
      return key;
  };

  // Calculate dynamic filters based on ALL cases in DB (not just search results)
  useEffect(() => {
    const allCases = getCases();
    
    // Extract unique categories
    const categories = Array.from(new Set(allCases.map(c => c.caseType).filter(Boolean))).sort();
    // Default categories to ensure they always appear even if empty initially
    const defaults = ["Administrative", "Land", "Criminal", "Civil", "Family", "Constitutional", "Corporate", "Labor", "Maritime"];
    setAvailableCategories(Array.from(new Set([...defaults, ...categories])).sort());

    // Extract unique years
    const years = Array.from(new Set(allCases.map(c => c.date ? c.date.substring(0, 4) : ''))).filter(y => y).sort((a, b) => b.localeCompare(a));
    setAvailableYears(years);

  }, [cases]); // Re-run if data source changes

  // Determine what to display based on view mode and folder depth
  useEffect(() => {
    if (!isSavedView) {
        setViewableCases(cases); // Search Mode: Show search results passed from App
    } else if (user) {
        // Saved Mode Logic
        const allCases = getCases();
        
        if (activeFolderId === 'general') {
            // Show cases in legacy savedCaseIds
            setViewableCases(allCases.filter(c => user.savedCaseIds?.includes(c.id)));
        } else if (activeFolderId) {
            // Show cases in specific folder
            const folder = user.folders?.find(f => f.id === activeFolderId);
            if (folder) {
                setViewableCases(allCases.filter(c => folder.caseIds.includes(c.id)));
            } else {
                setViewableCases([]);
            }
        } else {
            // Root Saved View: Don't show cases yet, we will show Folder Grid
            setViewableCases([]); 
        }
    }
  }, [isSavedView, activeFolderId, user, cases]);

  // Apply Client-Side Filters
  const displayedCases = useMemo(() => {
    return viewableCases.filter(c => {
        // Category Filter
        if (selectedCategories.length > 0 && !selectedCategories.includes(c.caseType)) return false;
        
        // Jurisdiction Filter (Simple string match)
        if (selectedJurisdictions.length > 0) {
            const matches = selectedJurisdictions.some(j => c.court.toLowerCase().includes(j.toLowerCase()));
            if (!matches) return false;
        }

        // Year Filter
        if (selectedYears.length > 0) {
            if (!c.date) return false; // Skip if no date
            const year = parseInt(c.date.substring(0, 4));
            const matches = selectedYears.some(opt => {
                if (opt.includes('-')) {
                     const [start, end] = opt.split('-').map(Number);
                     return year >= start && year <= end;
                }
                if (opt.startsWith('Pre-')) {
                     const limit = parseInt(opt.replace('Pre-', ''));
                     return year < limit;
                }
                return year.toString() === opt;
            });
            if (!matches) return false;
        }

        return true;
    });
  }, [viewableCases, selectedCategories, selectedJurisdictions, selectedYears]);

  // GROUPING LOGIC
  const groupedCases = useMemo(() => {
      if (groupBy === 'NONE') return null;

      const groups: Record<string, LegalCase[]> = {};
      
      displayedCases.forEach(c => {
          let key = '';
          if (groupBy === 'COURT') key = c.court || 'Unknown Court';
          else if (groupBy === 'YEAR') key = c.date ? c.date.substring(0, 4) : 'Unknown Year';
          else if (groupBy === 'TYPE') key = c.caseType || 'Uncategorized';
          
          if (!groups[key]) groups[key] = [];
          groups[key].push(c);
      });

      // Sort keys?
      return groups;
  }, [displayedCases, groupBy]);

  const toggleFilter = (setFn: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
      setFn(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  };

  const toggleAnalysisSelection = (caseId: string) => {
      setSelectedForAnalysis(prev => {
          if (prev.includes(caseId)) return prev.filter(id => id !== caseId);
          return [...prev, caseId];
      });
  };

  // Determine if a case is saved in ANY folder for the quick icon
  const isCaseSaved = (caseId: string) => {
    if (!user) return false;
    const inFolders = user.folders?.some(f => f.caseIds.includes(caseId));
    const inGeneral = user.savedCaseIds?.includes(caseId);
    return inFolders || inGeneral;
  };

  // RENDER: Saved View Root (Folder Grid)
  if (isSavedView && !activeFolderId && user) {
      return (
          <div className="max-w-6xl mx-auto px-4 py-12 min-h-screen font-myanmar">
              <div className="mb-8">
                  <h2 className="text-3xl font-serif font-bold text-slate-900">{t('nav_saved')}</h2>
                  <p className="text-gray-500">Manage your research folders and saved cases.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {/* General Folder (Legacy) */}
                  <div 
                    onClick={() => setActiveFolderId('general')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gold-300 transition cursor-pointer group relative overflow-hidden"
                  >
                      <div className="absolute top-0 left-0 w-full h-1 bg-gray-300 group-hover:bg-gold-500 transition-colors"></div>
                      <div className="flex justify-between items-start mb-4">
                          <Folder className="w-10 h-10 text-gray-400 group-hover:text-gold-500 transition-colors" />
                          <span className="text-2xl font-bold text-slate-900">{user.savedCaseIds?.length || 0}</span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-gold-700">General Items</h3>
                      <p className="text-xs text-gray-400 mt-1">Uncategorized saves</p>
                  </div>

                  {/* Custom Folders */}
                  {user.folders?.map(folder => (
                      <div 
                        key={folder.id}
                        onClick={() => setActiveFolderId(folder.id)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition cursor-pointer group relative overflow-hidden"
                      >
                          <div className="absolute top-0 left-0 w-full h-1 bg-blue-100 group-hover:bg-blue-500 transition-colors"></div>
                          <div className="flex justify-between items-start mb-4">
                              <Folder className="w-10 h-10 text-blue-200 group-hover:text-blue-500 transition-colors" />
                              <span className="text-2xl font-bold text-slate-900">{folder.caseIds.length}</span>
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-800 truncate">{folder.name}</h3>
                          <p className="text-xs text-gray-400 mt-1">Created {new Date(folder.dateCreated).toLocaleDateString()}</p>
                      </div>
                  ))}

                  {/* Create New Placeholder (Visual only, creates via save usually) */}
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-gray-400">
                      <FolderPlus className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium">Create via "{t('save_case')}"</span>
                  </div>
              </div>
          </div>
      )
  }

  // RENDER: Case List (Search Results OR Inside a Folder)
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex gap-10 bg-paper min-h-screen relative pb-32 font-myanmar">
      {/* Sidebar Filters - Only show on Search View or if needed */}
      {!isSavedView && (
        <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-8">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                    <SlidersHorizontal className="h-5 w-5 text-gold-600" />
                    <h3 className="font-serif font-bold text-slate-900 text-lg">{t('filters_title')}</h3>
                </div>
                
                <FilterGroup 
                    title="Case Categories" 
                    options={availableCategories} 
                    selected={selectedCategories}
                    onChange={(val) => toggleFilter(setSelectedCategories, val)}
                    getLabel={getTrans}
                />
                <FilterGroup 
                    title="Jurisdiction" 
                    options={["Supreme Court", "High Court", "District Court", "Special Tribunal"]} 
                    selected={selectedJurisdictions}
                    onChange={(val) => toggleFilter(setSelectedJurisdictions, val)}
                    getLabel={getTrans}
                />
                <FilterGroup 
                    title="Year" 
                    options={availableYears.length > 0 ? availableYears : ["2024", "2023", "2022", "2010-2021", "Pre-2010"]} 
                    selected={selectedYears}
                    onChange={(val) => toggleFilter(setSelectedYears, val)}
                    getLabel={(l) => l} // Years don't need translation
                />
            </div>
        </div>
      )}

      {/* Main Results */}
      <div className="flex-1 relative">
        <div className="mb-8 flex justify-between items-end border-b border-gray-200 pb-4">
          <div>
              {/* Back Button for Folder View */}
              {isSavedView && activeFolderId && (
                  <button 
                    onClick={() => setActiveFolderId(null)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 mb-3 transition"
                  >
                      <ArrowLeft className="w-4 h-4" /> Back to Folders
                  </button>
              )}

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {isSavedView ? t('results_folder') : t('results_search')}
              </p>
              <h2 className="text-3xl font-serif text-slate-900">
                {isSavedView ? (
                    <span>
                         {activeFolderId === 'general' ? 'General Items' : user?.folders?.find(f => f.id === activeFolderId)?.name}
                    </span>
                ) : (
                    <span>
                        {t('results_found_1')}{displayedCases.length}{t('results_found_2')} <span className="text-gold-600 italic">"{query || 'All Cases'}"</span>
                    </span>
                )}
              </h2>
          </div>
          
          {!isSavedView && (
            <div className="flex gap-4 items-center">
                {/* Group By Control */}
                <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-gray-500">Group by:</span>
                    <div className="relative">
                        <select 
                            className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm font-medium text-slate-900 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 cursor-pointer"
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value as any)}
                        >
                            <option value="NONE">None</option>
                            <option value="COURT">Court</option>
                            <option value="YEAR">Year</option>
                            <option value="TYPE">Type</option>
                        </select>
                        <Layers className="w-4 h-4 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
                    </div>
                </div>

                {/* Sort By Control */}
                <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-gray-500">{t('sort_by')}:</span>
                    <div className="relative">
                        <select className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm font-medium text-slate-900 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 cursor-pointer">
                            <option>Relevance</option>
                            <option>Date (Newest)</option>
                            <option>Date (Oldest)</option>
                            <option>Most Cited</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2 pointer-events-none" />
                    </div>
                </div>
            </div>
          )}
        </div>
        
        {/* Boolean Search Tip */}
        {!isSavedView && query && (
             <div className="mb-6 bg-slate-900 text-slate-300 text-xs px-4 py-2 rounded-lg inline-flex items-center gap-2">
                 <Filter className="w-3 h-3 text-gold-500" />
                 <span>{t('pro_tip')}</span>
             </div>
        )}

        <div className="space-y-6">
          {groupBy === 'NONE' ? (
              // Flat List View
              displayedCases.map((c) => (
                  <CaseCard 
                      key={c.id} 
                      c={c} 
                      saved={isCaseSaved(c.id)}
                      isSelected={selectedForAnalysis.includes(c.id)}
                      onSelectCase={onSelectCase}
                      onToggleSave={onToggleSave}
                      toggleAnalysisSelection={toggleAnalysisSelection}
                      getTrans={getTrans}
                  />
              ))
          ) : (
              // Grouped View
              Object.entries(groupedCases || {}).map(([groupName, groupCases]) => {
                  const casesList = groupCases as LegalCase[];
                  return (
                    <div key={groupName} className="mb-8">
                        <div className="flex items-center gap-3 mb-4 sticky top-20 z-10 bg-paper py-2">
                            <h3 className="text-xl font-bold text-slate-800 font-serif border-l-4 border-gold-500 pl-3">
                                {getTrans(groupName)}
                            </h3>
                            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{casesList.length}</span>
                        </div>
                        <div className="space-y-6 pl-4 border-l-2 border-dashed border-gray-200 ml-1">
                            {casesList.map(c => (
                                <CaseCard 
                                    key={c.id} 
                                    c={c} 
                                    saved={isCaseSaved(c.id)}
                                    isSelected={selectedForAnalysis.includes(c.id)}
                                    onSelectCase={onSelectCase}
                                    onToggleSave={onToggleSave}
                                    toggleAnalysisSelection={toggleAnalysisSelection}
                                    getTrans={getTrans}
                                />
                            ))}
                        </div>
                    </div>
                  );
              })
          )}
          
          {displayedCases.length === 0 && (
            <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Book className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No cases found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">
                  {isSavedView ? "This folder is empty." : "Try adjusting your search or filters."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar for Multi-Analysis */}
      {selectedForAnalysis.length > 0 && onAnalyze && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex flex-wrap items-center justify-center gap-4 z-50 animate-in slide-in-from-bottom-6 border border-gold-500/30 max-w-[95vw]">
              <div className="flex items-center gap-3 border-r border-white/20 pr-6">
                  <div className="bg-gold-500 text-slate-900 font-bold w-8 h-8 rounded-full flex items-center justify-center">
                      {selectedForAnalysis.length}
                  </div>
                  <div className="text-sm font-bold whitespace-nowrap">Cases Selected</div>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto">
                  <button 
                      onClick={() => onAnalyze(selectedForAnalysis, 'POINTS')}
                      className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-gold-500 hover:text-slate-900 rounded-lg transition text-xs md:text-sm font-bold whitespace-nowrap"
                  >
                      <BrainCircuit className="w-4 h-4" /> Synthesis
                  </button>
                  <button 
                      onClick={() => onAnalyze(selectedForAnalysis, 'CONTRADICTIONS')}
                      className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-red-500 hover:text-white rounded-lg transition text-xs md:text-sm font-bold whitespace-nowrap"
                  >
                      <ArrowRightLeft className="w-4 h-4" /> Contradictions
                  </button>
                  <button 
                      onClick={() => onAnalyze(selectedForAnalysis, 'SIMILARITY')}
                      className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-blue-500 hover:text-white rounded-lg transition text-xs md:text-sm font-bold whitespace-nowrap"
                  >
                      <Scale className="w-4 h-4" /> Common Points
                  </button>
                  {/* NEW CUSTOM BUTTON */}
                  <button 
                      onClick={() => onAnalyze(selectedForAnalysis, 'CUSTOM')}
                      className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-purple-500 hover:text-white rounded-lg transition text-xs md:text-sm font-bold whitespace-nowrap"
                  >
                      <Sparkles className="w-4 h-4" /> Custom
                  </button>
              </div>

              <button 
                  onClick={() => setSelectedForAnalysis([])}
                  className="text-gray-400 hover:text-white ml-2"
              >
                  <X className="w-5 h-5" />
              </button>
          </div>
      )}

    </div>
  );
};

const FilterGroup = ({ title, options, selected, onChange, getLabel }: { title: string, options: string[], selected: string[], onChange: (val: string) => void, getLabel: (val: string) => string }) => (
  <div>
    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">{title}</h4>
    <div className="space-y-3">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-3 text-sm text-gray-600 hover:text-slate-900 cursor-pointer group transition">
          <div className="relative flex items-center">
            <input 
                type="checkbox" 
                className="peer h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500 cursor-pointer appearance-none border checked:bg-gold-600 checked:border-gold-600 transition-all"
                checked={selected.includes(opt)}
                onChange={() => onChange(opt)}
            />
            <svg className="absolute w-3 h-3 text-white hidden peer-checked:block pointer-events-none left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <span className={`group-hover:font-medium transition-all ${selected.includes(opt) ? 'font-bold text-slate-900' : ''}`}>{getLabel(opt)}</span>
        </label>
      ))}
    </div>
  </div>
);
