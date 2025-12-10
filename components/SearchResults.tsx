import React from 'react';
import { LegalCase } from '../types';
import { Book, ChevronRight, Bookmark, Filter, SlidersHorizontal } from 'lucide-react';

interface SearchResultsProps {
  cases: LegalCase[];
  query: string;
  onSelectCase: (c: LegalCase) => void;
  savedCaseIds: string[];
  onToggleSave: (id: string) => void;
  isSavedView: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ cases, query, onSelectCase, savedCaseIds, onToggleSave, isSavedView }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 flex gap-10 bg-paper min-h-screen">
      {/* Sidebar Filters */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 space-y-8">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200">
                <SlidersHorizontal className="h-5 w-5 text-gold-600" />
                <h3 className="font-serif font-bold text-slate-900 text-lg">Filters</h3>
            </div>
            
            <FilterGroup title="Case Categories" options={["Administrative", "Land", "Criminal", "Civil", "Family", "Constitutional", "Corporate", "Labor", "Maritime"]} />
            <FilterGroup title="Jurisdiction" options={["Supreme Court", "High Court", "District Court", "Special Tribunal"]} />
            <FilterGroup title="Year" options={["2024", "2023", "2022", "2010-2021", "Pre-2010"]} />
        </div>
      </div>

      {/* Main Results */}
      <div className="flex-1">
        <div className="mb-8 flex justify-between items-end border-b border-gray-200 pb-4">
          <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  {isSavedView ? 'My Library' : 'Search Results'}
              </p>
              <h2 className="text-3xl font-serif text-slate-900">
                {cases.length} Documents {isSavedView ? 'Saved' : 'Found'} <span className="text-gold-600 italic">"{query || 'All Cases'}"</span>
              </h2>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-sm font-medium text-gray-500">Sort by:</span>
            <select className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm font-medium text-slate-900 outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500">
              <option>Relevance</option>
              <option>Date (Newest)</option>
              <option>Date (Oldest)</option>
              <option>Most Cited</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {cases.map((c) => {
              const isSaved = savedCaseIds.includes(c.id);
              return (
                <div 
                  key={c.id} 
                  className="bg-white p-8 rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-300 group relative border border-gray-100 hover:border-gold-200"
                >
                  {/* Card Accent */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200 group-hover:bg-gold-500 rounded-l-xl transition-colors duration-300"></div>

                  <div className="pl-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded border border-slate-200 font-mono">
                                {c.citation}
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
                                {c.caseType}
                            </span>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSave(c.id);
                            }}
                            className={`transition p-2 rounded-full hover:bg-gray-100 ${isSaved ? 'text-gold-500 fill-current' : 'text-gray-300 hover:text-gold-500'}`}
                            title={isSaved ? "Remove from Saved" : "Save Case"}
                        >
                            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-gold-500' : ''}`} />
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
                                <span className="text-gray-400">Date:</span> <span className="text-slate-800">{c.date}</span>
                            </span>
                            {c.judges.length > 0 && (
                                <span className="flex items-center gap-1">
                                    <span className="text-gray-400">Judge:</span> <span className="text-slate-800 font-myanmar">{c.judges[0]}</span>
                                </span>
                            )}
                          </div>

                          <p className="text-gray-600 line-clamp-3 mb-6 text-sm leading-7 font-myanmar">
                            {c.summary || c.content.substring(0, 300) + "..."}
                          </p>

                          <div className="flex items-center text-gold-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                            Read Full Judgment <ChevronRight className="h-4 w-4 ml-1" />
                          </div>
                      </div>
                  </div>
                </div>
              );
          })}
          
          {cases.length === 0 && (
            <div className="text-center py-24 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Book className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No cases found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mt-2">
                  {isSavedView ? "You haven't saved any cases yet." : "We couldn't find any rulings matching your criteria."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FilterGroup = ({ title, options }: { title: string, options: string[] }) => (
  <div>
    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">{title}</h4>
    <div className="space-y-3">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-3 text-sm text-gray-600 hover:text-slate-900 cursor-pointer group transition">
          <div className="relative flex items-center">
            <input type="checkbox" className="peer h-4 w-4 rounded border-gray-300 text-gold-600 focus:ring-gold-500 cursor-pointer appearance-none border checked:bg-gold-600 checked:border-gold-600 transition-all" />
            <svg className="absolute w-3 h-3 text-white hidden peer-checked:block pointer-events-none left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <span className="group-hover:font-medium transition-all">{opt}</span>
        </label>
      ))}
    </div>
  </div>
);
