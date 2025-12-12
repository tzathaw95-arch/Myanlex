
import React, { useState, useEffect } from 'react';
import { LegalCase, CaseBrief, User, Organization } from '../types';
import { askLegalAssistant } from '../services/geminiService';
import { getOrganizationById, toggleSharedCase } from '../services/db';
import { ArrowLeft, Printer, Share2, Download, MessageSquare, Sparkles, BookOpen, Scale, FileText, Bookmark, Lock, AlertTriangle, Building2, Check } from 'lucide-react';
import { canGenerateBrief, incrementBriefUsage } from '../services/auth';
import { useLanguage } from '../contexts/LanguageContext';

// Safe Internal Markdown Renderer to avoid dependency issues
const SimpleMarkdown: React.FC<{ children: string }> = ({ children }) => {
  if (!children) return null;
  const lines = children.split('\n');
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        
        // Headers
        if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-4 text-slate-900">{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 text-slate-900">{line.replace('## ', '')}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-8 text-slate-900">{line.replace('# ', '')}</h1>;
        
        // Lists
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            return (
                <div key={i} className="flex gap-2 ml-4">
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-800">{line.replace(/^[\*\-]\s/, '')}</span>
                </div>
            );
        }

        // Bold parsing
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <p key={i} className="text-justify leading-loose text-slate-800">
                {parts.map((part, j) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </p>
        );
      })}
    </div>
  );
};

interface CaseDetailProps {
  data: LegalCase;
  onBack: () => void;
  user: User | null;
  onToggleSave: (id: string) => void;
  onShowRegister: () => void;
}

type Tab = 'FULL_TEXT' | 'BRIEF' | 'AI_ANALYSIS' | 'RELATED';

export const CaseDetail: React.FC<CaseDetailProps> = ({ data, onBack, user, onToggleSave, onShowRegister }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('FULL_TEXT');
  const [brief, setBrief] = useState<CaseBrief | undefined>(data.brief); // Load from DB
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [limitError, setLimitError] = useState('');
  
  // Team Sharing
  const [org, setOrg] = useState<Organization | undefined>(undefined);
  const [isSharedWithTeam, setIsSharedWithTeam] = useState(false);

  // Check if saved in ANY folder
  const isSaved = user && (user.savedCaseIds?.includes(data.id) || user.folders?.some(f => f.caseIds.includes(data.id)));

  useEffect(() => {
    if (user?.organizationId) {
      const organization = getOrganizationById(user.organizationId);
      setOrg(organization);
      if (organization?.sharedCaseIds?.includes(data.id)) {
        setIsSharedWithTeam(true);
      }
    }
  }, [user, data.id]);

  const handleTeamShare = () => {
    if (!org) return;
    const updatedOrg = toggleSharedCase(org.id, data.id);
    if (updatedOrg) {
      setIsSharedWithTeam(updatedOrg.sharedCaseIds.includes(data.id));
    }
  };

  // Handle Tab Switching with Limit Logic
  const handleTabChange = (tab: Tab) => {
      if (tab === 'BRIEF') {
          // Check limits if brief is available (just viewing access control)
          // Since brief is pre-computed, we mainly check if user *can view* it
          const check = canGenerateBrief(user);
          if (!check.allowed) {
                setLimitError(check.reason === "GUEST_LIMIT_REACHED" 
                    ? "Guest Limit Reached: 1 Free Brief Per Month. Please register for unlimited access." 
                    : "Subscription Expired.");
                // Force register modal if guest limit reached
                if (check.reason === "GUEST_LIMIT_REACHED") onShowRegister();
                return;
          }
      }
      setActiveTab(tab);
      setLimitError('');
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;
    
    // Simple check for chat: Require login for chat? Or allow guests? 
    // Let's assume Guests can't use Chat for this requirement, only Briefs.
    if (!user) {
        onShowRegister();
        return;
    }

    setChatLoading(true);
    try {
      const resp = await askLegalAssistant(chatQuery, data.content);
      setChatResponse(resp || "Sorry, I couldn't generate a response.");
    } catch (err) {
      setChatResponse("Error connecting to Legal AI Assistant.");
    }
    setChatLoading(false);
  };

  return (
    <div className="bg-paper min-h-screen pb-20 font-myanmar">
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-18 z-40 px-6 py-4 shadow-sm flex justify-between items-center">
        <button onClick={onBack} className="group flex items-center text-slate-500 hover:text-slate-900 font-medium text-sm transition">
          <div className="bg-gray-100 p-1.5 rounded-full mr-2 group-hover:bg-slate-200 transition">
             <ArrowLeft className="h-4 w-4" /> 
          </div>
          {t('back_results')}
        </button>
        <div className="flex gap-3">
          
          {org && (
            <button 
               onClick={handleTeamShare}
               className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-lg border transition ${isSharedWithTeam ? 'bg-slate-100 text-slate-800 border-slate-300' : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100 border-gray-200'}`}
               title="Share to Firm Library"
            >
               {isSharedWithTeam ? <Check className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
               {isSharedWithTeam ? t('shared_firm') : t('share_firm')}
            </button>
          )}

          <button 
             onClick={() => onToggleSave(data.id)}
             className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-lg border transition ${isSaved ? 'bg-gold-50 text-gold-700 border-gold-200' : 'text-slate-600 hover:text-slate-900 hover:bg-gray-100 border-gray-200'}`}
          >
             <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-gold-700' : ''}`} />
             {isSaved ? t('saved') : t('save_case')}
          </button>
          <ActionButton icon={<Printer />} label={t('print')} />
          <ActionButton icon={<Download />} label={t('download')} />
          <ActionButton icon={<Share2 />} label={t('share')} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-10">
        {/* Case Header Card */}
        <div className="bg-white p-10 rounded-xl shadow-premium border border-gray-200 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-800 via-gold-500 to-slate-800"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                  <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded tracking-wider uppercase">
                      Judgment
                  </span>
                  <span className="text-slate-500 text-sm font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gold-500 rounded-full"></span>
                    {data.date}
                  </span>
              </div>
              <h1 className="text-3xl md:text-4xl text-slate-900 font-bold mb-3 font-myanmar leading-tight">
                {data.caseName}
              </h1>
              {data.caseNameEnglish && (
                <h2 className="text-xl text-slate-500 italic font-serif border-l-4 border-gold-200 pl-4">{data.caseNameEnglish}</h2>
              )}
            </div>
            
            <div className="bg-slate-50 px-6 py-4 rounded-lg border border-slate-100 text-center min-w-[150px]">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Citation</div>
              <div className="text-xl font-mono font-bold text-slate-900 whitespace-nowrap">{data.citation}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 border-t border-gray-100 pt-8">
            <InfoRow label="Court" value={data.court} />
            <InfoRow label="Case Type" value={data.caseType} />
            <InfoRow label="Judges" value={data.judges.join(', ')} />
            <InfoRow label="Parties" value={`${data.parties.plaintiff || 'N/A'} vs ${data.parties.defendant || 'N/A'}`} />
          </div>
        </div>

        {/* Layout: Sidebar + Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Tabs / Navigation */}
            <div className="w-full lg:w-64 flex-shrink-0">
                <div className="sticky top-32 space-y-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    <TabButton active={activeTab === 'FULL_TEXT'} onClick={() => handleTabChange('FULL_TEXT')} label={t('judgment_text')} icon={<FileText />} />
                    <TabButton active={activeTab === 'BRIEF'} onClick={() => handleTabChange('BRIEF')} label={t('case_brief')} icon={<Scale />} />
                    <TabButton 
                        active={activeTab === 'AI_ANALYSIS'} 
                        onClick={() => user ? handleTabChange('AI_ANALYSIS') : onShowRegister()} 
                        label={t('ai_assistant')}
                        icon={user ? <Sparkles /> : <Lock />} 
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white p-10 rounded-xl shadow-premium border border-gray-200 min-h-[600px]">
                
                {/* AI DISCLAIMER BANNER */}
                {(activeTab === 'BRIEF' || activeTab === 'AI_ANALYSIS') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-900">{t('ai_warning_title')}</h4>
                            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                            {t('ai_warning_text')}
                            </p>
                        </div>
                    </div>
                )}

                {limitError && activeTab === 'BRIEF' ? (
                     <div className="flex flex-col items-center justify-center py-20 text-center">
                         <div className="bg-red-50 p-4 rounded-full mb-4">
                             <Lock className="w-8 h-8 text-red-500" />
                         </div>
                         <h3 className="text-xl font-bold text-slate-900 mb-2">Access Limit Reached</h3>
                         <p className="text-gray-500 max-w-sm mb-6">{limitError}</p>
                         <button 
                            onClick={onShowRegister}
                            className="bg-gold-500 text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-gold-400 transition"
                         >
                            Start Free Trial for Unlimited Access
                         </button>
                     </div>
                ) : (
                    <>
                        {activeTab === 'FULL_TEXT' && (
                            <div>
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                    <h3 className="text-xl font-bold font-serif text-slate-900">{t('judgment_text')}</h3>
                                    <div className="text-xs text-gray-400 uppercase tracking-widest">{t('original_record')}</div>
                                </div>
                                {/* SIMPLE MARKDOWN RENDERER FOR JUDGMENT TEXT */}
                                <div className="prose prose-slate prose-lg max-w-none text-slate-800 font-myanmar leading-loose text-justify">
                                    <SimpleMarkdown>{data.content}</SimpleMarkdown>
                                </div>
                            </div>
                        )}

                        {activeTab === 'BRIEF' && (
                            <div>
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                    <h3 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
                                        <Scale className="text-gold-500 w-5 h-5" /> {t('case_brief')}
                                    </h3>
                                    <div className="bg-gold-50 text-gold-700 text-[10px] font-bold px-2 py-1 rounded border border-gold-200">{t('ai_generated')}</div>
                                </div>
                                {brief ? (
                                    <div className="space-y-8 font-myanmar text-justify">
                                        <BriefSection title={t('facts')} content={brief.facts} />
                                        <BriefSection title={t('issues')} content={brief.issues} isList />
                                        <BriefSection title={t('holding')} content={brief.holding} highlight />
                                        <BriefSection title={t('reasoning')} content={brief.reasoning} />
                                        <BriefSection title={t('principles')} content={brief.principles} isList />
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 text-gray-600 rounded border border-dashed border-gray-300 text-center">
                                        No brief available for this case. This might be an older record.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'AI_ANALYSIS' && (
                            <div className="flex flex-col h-[600px]">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
                                        <Sparkles className="text-blue-500 w-5 h-5" /> {t('ai_assistant')}
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto mb-6 border border-gray-100 rounded-xl p-6 bg-slate-50 font-myanmar shadow-inner">
                                    {chatResponse ? (
                                        <div className="prose max-w-none text-justify leading-loose">
                                            <SimpleMarkdown>{chatResponse}</SimpleMarkdown>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-400 mt-20">
                                            <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4">
                                                <MessageSquare className="h-8 w-8 text-gold-400" />
                                            </div>
                                            <p className="font-medium text-slate-600 mb-2">Start a conversation with this case.</p>
                                            <p className="text-sm">Ask about specific clauses, precedents, or contradictions.</p>
                                        </div>
                                    )}
                                </div>
                                <form onSubmit={handleChat} className="relative">
                                    <input
                                        type="text"
                                        value={chatQuery}
                                        onChange={(e) => setChatQuery(e.target.value)}
                                        placeholder={t('chat_placeholder')}
                                        className="w-full border border-gray-300 rounded-xl pl-6 pr-32 py-4 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 outline-none font-myanmar shadow-sm text-slate-800"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={chatLoading}
                                        className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white px-6 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-70 transition-colors"
                                    >
                                        {chatLoading ? t('chat_thinking') : t('chat_analyze')}
                                    </button>
                                </form>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex flex-col">
    <span className="text-xs text-gold-600 uppercase tracking-widest font-bold mb-1.5">{label}</span>
    <span className="text-slate-900 font-semibold font-myanmar text-base border-l-2 border-gray-200 pl-3">{value}</span>
  </div>
);

const ActionButton = ({ icon, label }: { icon: any, label: string }) => (
  <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-600 hover:text-slate-900 hover:bg-gray-100 rounded-lg border border-gray-200 transition">
    {React.cloneElement(icon, { className: "w-4 h-4" })}
    {label}
  </button>
);

const TabButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: any }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
      active ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-slate-900'
    }`}
  >
    {React.cloneElement(icon, { className: `w-4 h-4 ${active ? 'text-gold-400' : 'text-gray-400'}` })}
    {label}
  </button>
);

const BriefSection = ({ title, content, isList = false, highlight = false }: { title: string, content: string | string[], isList?: boolean, highlight?: boolean }) => (
  <div className={`p-6 rounded-xl border ${highlight ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50/50 border-gray-100'}`}>
    <h3 className="text-lg font-bold font-serif text-slate-900 mb-4 pb-2 border-b border-gray-200/50">{title}</h3>
    {isList && Array.isArray(content) ? (
      <ul className="list-disc list-outside ml-5 space-y-3 text-slate-700 leading-relaxed text-justify">
        {content.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    ) : (
      <p className="text-slate-700 leading-8 text-justify whitespace-pre-wrap">{content}</p>
    )}
  </div>
);
