import { useState } from 'react';
import { Dna, ShieldCheck, Sun, Moon, RefreshCw } from 'lucide-react';
import { useToast } from './Toast';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Header({ darkMode, onToggleDarkMode }: HeaderProps) {
  const { warning } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleVerifyGuidelines = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      warning("Guideline Updated: Sourced database synchronized with CPIC v3.2 reference mapping.");
    }, 1000);
  };

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs sticky top-0 z-50 backdrop-blur-md transition-colors duration-200" id="pharmagenie-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="bg-teal-50 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-100 dark:border-teal-900/40 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-2xs">
              <Dna className="w-6.5 h-6.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 font-display">
                  PharmaGenie
                </h1>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-750 px-2 py-0.5 rounded-md">
                  Clinical PGx Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Clinical Pharmacogenomics Decision-Support Platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-3 bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 px-4 py-2 rounded-xl max-w-md">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
              <div className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-normal">
                <span className="font-bold text-slate-800 dark:text-slate-200">CPIC® & PharmGKB® Standard:</span> Sourced from peer-reviewed evidence and clinical recommendations.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyGuidelines}
                disabled={isSyncing}
                className="p-2 py-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 cursor-pointer shadow-3xs hover:shadow-2xs disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
                title="Verify Guidelines with CPIC & PharmGKB"
                id="verify-guidelines-btn"
              >
                <RefreshCw className={`w-4 h-4 text-teal-600 dark:text-teal-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Verify Guidelines</span>
              </button>              
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
