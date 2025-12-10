import React, { useState } from 'react';
import { Book, FileText, Languages, Search, Download, BookOpen, Gavel } from 'lucide-react';
import { getStatutes, getDictionaryTerms, getTemplates } from '../services/db';

type ResourceTab = 'LEGISLATION' | 'DICTIONARY' | 'TEMPLATES';

export const Resources: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ResourceTab>('LEGISLATION');
  const [dictQuery, setDictQuery] = useState('');

  const statutes = getStatutes();
  const dictionaryTerms = getDictionaryTerms(dictQuery);
  const templates = getTemplates();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-[80vh]">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Legal Tools & Resources</h1>
        <p className="text-gray-500">Essential resources for researchers, students, and practitioners.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
             <button 
               onClick={() => setActiveTab('LEGISLATION')}
               className={`w-full flex items-center gap-3 px-6 py-4 text-left transition ${activeTab === 'LEGISLATION' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <Gavel className={`w-5 h-5 ${activeTab === 'LEGISLATION' ? 'text-gold-400' : 'text-gray-400'}`} />
               <span className="font-bold text-sm">Legislation</span>
             </button>
             <button 
               onClick={() => setActiveTab('DICTIONARY')}
               className={`w-full flex items-center gap-3 px-6 py-4 text-left transition ${activeTab === 'DICTIONARY' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <Languages className={`w-5 h-5 ${activeTab === 'DICTIONARY' ? 'text-gold-400' : 'text-gray-400'}`} />
               <span className="font-bold text-sm">Legal Dictionary</span>
             </button>
             <button 
               onClick={() => setActiveTab('TEMPLATES')}
               className={`w-full flex items-center gap-3 px-6 py-4 text-left transition ${activeTab === 'TEMPLATES' ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <FileText className={`w-5 h-5 ${activeTab === 'TEMPLATES' ? 'text-gold-400' : 'text-gray-400'}`} />
               <span className="font-bold text-sm">Templates</span>
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          
          {/* LEGISLATION TAB */}
          {activeTab === 'LEGISLATION' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gold-500" /> Myanmar Statutes
                 </h2>
                 <span className="text-xs text-gray-500">{statutes.length} Acts Available</span>
               </div>
               
               <div className="grid gap-4">
                 {statutes.map(law => (
                   <div key={law.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:border-gold-300 transition group cursor-pointer">
                      <div className="flex justify-between items-start">
                         <div>
                            <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-blue-800 transition">
                               {law.title} <span className="font-myanmar text-gray-400 font-normal ml-2">{law.titleMm}</span>
                            </h3>
                            <div className="flex gap-2 mt-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                               <span className="bg-slate-100 px-2 py-1 rounded">{law.year}</span>
                               <span className="bg-slate-100 px-2 py-1 rounded">{law.category}</span>
                            </div>
                            <p className="text-gray-600 text-sm mt-3">{law.description}</p>
                         </div>
                         <button className="text-gold-500 hover:text-gold-600 p-2">
                            <Download className="w-5 h-5" />
                         </button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* DICTIONARY TAB */}
          {activeTab === 'DICTIONARY' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Languages className="w-5 h-5 text-gold-500" /> Legal Glossary
                 </h2>
               </div>

               <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center gap-3 sticky top-24 z-10">
                  <Search className="w-5 h-5 text-gray-400" />
                  <input 
                     type="text" 
                     placeholder="Search legal terms (English or Burmese)..."
                     className="flex-1 outline-none text-sm"
                     value={dictQuery}
                     onChange={(e) => setDictQuery(e.target.value)}
                  />
               </div>

               <div className="space-y-4">
                  {dictionaryTerms.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No terms found matching "{dictQuery}"</div>
                  ) : (
                    dictionaryTerms.map(term => (
                        <div key={term.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                            <div className="flex items-baseline justify-between mb-2">
                                <h3 className="font-bold text-lg text-slate-900">{term.term}</h3>
                                <span className="text-xs text-gray-400 font-bold uppercase">{term.category}</span>
                            </div>
                            <h4 className="font-myanmar text-gold-600 font-bold text-lg mb-2">{term.definitionMm}</h4>
                            <p className="text-gray-600 text-sm italic border-l-2 border-gray-200 pl-3">{term.definitionEn}</p>
                        </div>
                    ))
                  )}
               </div>
             </div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'TEMPLATES' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gold-500" /> Drafting Templates
                 </h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tmp => (
                     <div key={tmp.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between h-48">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase">{tmp.category}</span>
                                <span className="text-[10px] text-gray-400 font-bold">{tmp.format}</span>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">{tmp.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{tmp.description}</p>
                        </div>
                        <button className="w-full mt-4 flex items-center justify-center gap-2 border border-slate-200 text-slate-700 font-bold text-xs py-2 rounded hover:bg-slate-50 transition">
                           <Download className="w-4 h-4" /> Download Template
                        </button>
                     </div>
                  ))}
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};
