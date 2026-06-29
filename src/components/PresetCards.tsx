import { PRESET_CASES } from '../data/guidelines';
import { PresetCase } from '../types';
import { BookOpen, HelpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface PresetCardsProps {
  onSelectCase: (preset: PresetCase) => void;
  selectedCaseId: string | null;
}

export default function PresetCards({ onSelectCase, selectedCaseId }: PresetCardsProps) {
  // Helper to choose indicator icon for each preset case
  const getIcon = (gene: string, drug: string) => {
    if (gene === 'CYP2D6' && drug === 'Ibuprofen') {
      return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
    if (gene === 'DPYD' || gene === 'CYP2C19') {
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
    return <BookOpen className="w-4 h-4 text-teal-400" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm" id="preset-scenarios-section">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Demo Scenarios & Preset Cases
        </h3>
        <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full border border-slate-200">
          Click any card to load configuration
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRESET_CASES.map((caseItem) => {
          const isSelected = selectedCaseId === caseItem.id;
          return (
            <button
              key={caseItem.id}
              onClick={() => onSelectCase(caseItem)}
              className={`text-left p-4 rounded-lg border transition-all flex flex-col justify-between h-full group relative hover:shadow-md ${
                isSelected
                  ? 'border-slate-900 bg-slate-900/5 ring-2 ring-slate-900/10'
                  : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
              }`}
              id={`preset-card-${caseItem.id}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {caseItem.gene}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {caseItem.drug}
                  </span>
                </div>
                
                <h4 className="font-semibold text-sm text-slate-900 mb-1 group-hover:text-slate-950 transition-colors">
                  {caseItem.title}
                </h4>
                
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {caseItem.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                {getIcon(caseItem.gene, caseItem.drug)}
                <span>{caseItem.phenotype}</span>
              </div>

              {isSelected && (
                <div className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
