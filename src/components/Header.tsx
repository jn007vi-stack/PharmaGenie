import { Dna, ShieldAlert } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm" id="pharmagenie-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/15 p-2.5 rounded-lg border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Dna className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
                PharmaGenie
                <span className="text-xs font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full">
                  v1.2.0 Clinical Reference
                </span>
              </h1>
              <p className="text-sm text-slate-300 font-medium">
                Clinical Pharmacogenomics Decision-Support Assistant
              </p>
            </div>
          </div>
          
          <div className="flex items-start md:items-center gap-2.5 bg-slate-800/60 border border-slate-700/60 p-3 rounded-lg max-w-md">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 md:mt-0" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>Clinical Support Tool:</strong> Designed strictly as an educational and reference helper based on CPIC guidelines. Not for direct diagnosis.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
