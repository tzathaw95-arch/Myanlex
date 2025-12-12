
import React, { useState } from 'react';
import { Search, BookOpen, Gavel, Calendar, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroProps {
  onSearch: (query: string) => void;
  onShowPricing: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, onShowPricing }) => {
  const [query, setQuery] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="relative bg-slate-900 text-white overflow-hidden font-myanmar">
        {/* Abstract Premium Background */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black opacity-80"></div>
         {/* Subtle Grid Pattern */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 pt-20 pb-24 text-center">
        
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 backdrop-blur-sm">
            <span className="text-gold-400 text-xs font-bold tracking-widest uppercase">{t('hero_badge')}</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-serif font-medium mb-6 leading-tight tracking-tight">
          {t('hero_title_1')} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-gold-600 font-semibold italic">{t('hero_title_2')}</span>
        </h1>
        
        <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
          {t('hero_subtitle')}
        </p>
        
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto mb-16 group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-gold-400 to-gold-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative flex items-center bg-white rounded-xl shadow-2xl p-1">
              <Search className="h-6 w-6 text-slate-400 ml-4" />
              <input
                type="text"
                className="w-full h-14 pl-4 pr-4 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-lg font-medium font-myanmar"
                placeholder={t('search_placeholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-12 rounded-lg font-semibold transition-all transform active:scale-95 border border-slate-700 whitespace-nowrap"
              >
                {t('search_btn')}
              </button>
          </div>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          <FilterButton icon={<Gavel />} label={t('filter_supreme')} />
          <FilterButton icon={<BookOpen />} label={t('filter_civil')} />
          <FilterButton icon={<BookOpen />} label={t('filter_criminal')} />
          <FilterButton icon={<Calendar />} label={t('filter_recent')} />
        </div>

        <div className="border-t border-white/10 pt-8">
             <button 
                onClick={onShowPricing}
                className="group text-slate-400 hover:text-gold-400 text-sm font-medium flex items-center justify-center gap-2 transition"
            >
                {t('view_plans')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
  <button className="flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-gold-500/50 transition backdrop-blur-sm group">
    <div className="bg-slate-800 p-2 rounded-md group-hover:bg-gold-500 group-hover:text-slate-900 transition text-gold-400">
        {React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })
        : icon}
    </div>
    <span className="text-sm font-medium text-slate-200">{label}</span>
  </button>
);
