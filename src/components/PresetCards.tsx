import { PRESET_CASES } from '../data/guidelines';
import { PresetCase } from '../types';
import { BookOpen, HelpCircle, AlertTriangle, Lightbulb, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface PresetCardsProps {
  onSelectCase: (preset: PresetCase) => void;
  selectedCaseId: string | null;
}

export default function PresetCards({ onSelectCase, selectedCaseId }: PresetCardsProps) {
  // Helper to choose indicator icon for each preset case
  const getIcon = (gene: string, drug: string) => {
    if (gene === 'CYP2D6' && drug === 'Ibuprofen') {
      return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
    if (gene === 'DPYD' || gene === 'CYP2C19') {
      return <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />;
    }
    return <BookOpen className="w-3.5 h-3.5 text-teal-500" />;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs transition-colors duration-200" id="preset-scenarios-section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Star className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-display">
            Interactive Reference Scenarios
          </h3>
        </div>
        <span className="self-start sm:self-auto text-[11px] bg-teal-50/50 dark:bg-teal-950/25 text-teal-700 dark:text-teal-400 font-bold px-2.5 py-1 rounded-lg border border-teal-100/50 dark:border-teal-900/30">
          💡 Select any preset card to populate clinical configurations instantly
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRESET_CASES.map((caseItem) => {
          const isSelected = selectedCaseId === caseItem.id;
          return (
            <motion.button
              key={caseItem.id}
              onClick={() => onSelectCase(caseItem)}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`text-left p-4.5 rounded-xl border transition-all flex flex-col justify-between h-full relative cursor-pointer ${
                isSelected
                  ? 'border-teal-650 dark:border-teal-400 bg-teal-50/15 dark:bg-teal-950/10 shadow-sm ring-1 ring-teal-500/10'
                  : 'border-slate-200/70 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
              }`}
              id={`preset-card-${caseItem.id}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border shadow-2xs ${
                    isSelected ? 'bg-teal-600 text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {caseItem.gene}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {caseItem.drug}
                  </span>
                </div>
                
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1.5 font-display">
                  {caseItem.title}
                </h4>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                  {caseItem.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {getIcon(caseItem.gene, caseItem.drug)}
                <span className="truncate">{caseItem.phenotype}</span>
              </div>

              {isSelected && (
                <div className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
