
import React, { useState, useEffect } from 'react';
import { LegalCase, User } from '../types';
import { analyzeMultipleCases, AnalysisMode } from '../services/geminiService';
import { ArrowLeft, Sparkles, Scale, AlertTriangle, ArrowRightLeft, BrainCircuit, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MultiAnalysisViewProps {
  cases: LegalCase[];
  mode: AnalysisMode;
  onBack: () => void;
  user: User | null;
  onShowRegister: () => void;
}

export const MultiAnalysisView: React.FC<MultiAnalysisViewProps> = ({ cases, mode: initialMode, onBack, user, onShowRegister }) => {
  const [activeMode, setActiveMode] = useState<AnalysisMode>(initialMode);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Custom Prompt State
  const [customPrompt, setCustomPrompt] = useState('');

  useEffect(() => {
    // Permission check
    if (!user) {
        onShowRegister();
        return;
    }
    
    // If standard mode, trigger immediately. If CUSTOM, wait for user input.
    if (activeMode !== 'CUSTOM') {
       handleAnalyze(activeMode);
    } else {
        // Reset result when switching to custom so input is visible
        setAnalysisResult('');
    }
  }, [activeMode, user]);

  const handleAnalyze = async (mode: AnalysisMode, promptText?: string) => {
      setLoading(true);
      setAnalysisResult('');
      try {
          const result = await analyzeMultipleCases(cases, mode, promptText);
          setAnalysisResult(result);
      } catch (e) {
          setAnalysisResult("Error generating analysis. Please try again later.");
      } finally {
          setLoading(false);
      }
  };

  const onCustomSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(customPrompt.trim()) {
          handleAnalyze('CUSTOM', customPrompt);
      }
  };

  const getModeLabel = (m: AnalysisMode) => {
      switch(m) {
          case 'POINTS': return 'Synthesis & Key Points';
          case 'CONTRADICTIONS': return 'Contradictions & Overrulings';
          case 'SIMILARITY': return 'Common Principles';
          case 'CUSTOM': return 'Custom Analysis';
      }
  };

  const getModeIcon = (m: AnalysisMode) => {
      switch(m) {
          case 'POINTS': return <BrainCircuit className="w-5 h-5 text-gold-500" />;
          case 'CONTRADICTIONS': return <ArrowRightLeft className="w-5 h-5 text-red-500" />;
          case 'SIMILARITY': return <Scale className="w-5 h-5 text-blue-500" />;
          case 'CUSTOM': return <MessageSquare className="w-5 h-5 text-purple-500" />;
      }
  };

  return (
    <div className="bg-paper min-h-screen pb-20">
       {/* Header */}
       <div className="bg-white border-b border-gray-200 sticky top-18 z-40 px-6 py-4 shadow-sm flex justify-between items-center">
        <button onClick={onBack} className="group flex items-center text-slate-500 hover:text-slate-900 font-medium text-sm transition">
          <div className="bg-gray-100 p-1.5 rounded-full mr-2 group-hover:bg-slate-200 transition">
             <ArrowLeft className="h-4 w-4" /> 
          </div>
          Back to Results
        </button>
        <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-gold-500" /> Multi-Case Analysis
            </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-10">
          <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Sidebar: Selected Cases */}
              <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Analyzing {cases.length} Cases</h3>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                          {cases.map((c, i) => (
                              <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                  <div className="font-bold text-slate-800 mb-1">{c.caseName}</div>
                                  <div className="text-xs text-gray-500 flex justify-between">
                                      <span>{c.citation}</span>
                                      <span>{c.date.substring(0, 4)}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Mode Switcher */}
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 space-y-1">
                      {(['POINTS', 'CONTRADICTIONS', 'SIMILARITY', 'CUSTOM'] as AnalysisMode[]).map(m => (
                          <button
                            key={m}
                            onClick={() => setActiveMode(m)}
                            disabled={loading}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${activeMode === m ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                          >
                              {getModeIcon(m)}
                              <span className="font-bold text-sm">{getModeLabel(m)}</span>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Main Analysis Area */}
              <div className="flex-1">
                  <div className="bg-white p-10 rounded-xl shadow-premium border border-gray-200 min-h-[600px] relative">
                      
                      {/* Disclaimer */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-amber-900">AI-Generated Analysis</h4>
                            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                            This comparative analysis is generated by AI. It provides a synthesis of the selected cases but should not be cited as a definitive legal authority without verification.
                            </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                          {getModeIcon(activeMode)}
                          <h2 className="text-2xl font-serif font-bold text-slate-900">{getModeLabel(activeMode)}</h2>
                      </div>

                      {/* CUSTOM INPUT AREA */}
                      {activeMode === 'CUSTOM' && !loading && !analysisResult && (
                          <div className="mb-8 animate-in fade-in slide-in-from-top-4">
                              <form onSubmit={onCustomSubmit}>
                                  <label className="block text-sm font-bold text-slate-700 mb-2">
                                      What specific aspect should I analyze across these cases?
                                  </label>
                                  <textarea 
                                      className="w-full border border-gray-300 rounded-lg p-4 font-myanmar text-sm h-32 focus:ring-2 focus:ring-gold-500 outline-none"
                                      placeholder="e.g. Compare the sentencing severity for drug trafficking cases in this list..."
                                      value={customPrompt}
                                      onChange={(e) => setCustomPrompt(e.target.value)}
                                  />
                                  <div className="flex justify-end mt-4">
                                      <button 
                                          type="submit" 
                                          disabled={!customPrompt.trim()}
                                          className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-50"
                                      >
                                          Run Custom Analysis
                                      </button>
                                  </div>
                              </form>
                          </div>
                      )}

                      {loading ? (
                          <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                              <Sparkles className="w-12 h-12 text-gold-400 mb-4 animate-spin-slow" />
                              <h3 className="text-xl font-bold text-slate-900">Analyzing Jurisprudence...</h3>
                              <p className="text-gray-500 mt-2">Synthesizing points across {cases.length} judgments.</p>
                          </div>
                      ) : (
                          <div className="prose prose-slate prose-lg max-w-none text-slate-800 font-myanmar leading-loose text-justify">
                              <ReactMarkdown>{analysisResult}</ReactMarkdown>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
