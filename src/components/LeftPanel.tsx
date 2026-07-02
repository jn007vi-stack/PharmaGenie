import React, { useState, useEffect, useRef } from 'react';
import { GENES, PHENOTYPES, DRUGS } from '../data/guidelines';
import { GeneType, PhenotypeType, AgeGroupType } from '../types';
import { 
  Activity, 
  Beaker, 
  Dna, 
  ArrowRight, 
  RefreshCw, 
  Sparkles, 
  User, 
  Settings2,
  Search,
  History,
  Check,
  ChevronDown,
  X,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

interface LeftPanelProps {
  patientId: string;
  onChangePatientId: (id: string) => void;
  selectedGene: GeneType;
  onChangeGene: (gene: GeneType) => void;
  selectedPhenotype: PhenotypeType;
  onChangePhenotype: (phenotype: PhenotypeType) => void;
  selectedAgeGroup: AgeGroupType;
  onChangeAgeGroup: (ageGroup: AgeGroupType) => void;
  drugInput: string;
  onChangeDrug: (drug: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  isLimitReached?: boolean;
  onOpenUpgradeModal?: () => void;
}

interface SearchableDrug {
  name: string;
  category: string;
  aliases: string[];
}

// Expanded popular drug directory with brand name/generic aliases for autocomplete
const POPULAR_DRUGS: SearchableDrug[] = [
  { name: 'Codeine', category: 'Analgesic / Opioid', aliases: ['Tylenol #3', 'Tylenol with Codeine', 'Codeine Phosphate', 'Paveral'] },
  { name: 'Clopidogrel', category: 'Antiplatelet', aliases: ['Plavix'] },
  { name: 'Fluorouracil', category: 'Oncology / Chemotherapy', aliases: ['5-FU', '5FU', 'Adrucil', 'Efudex', 'Fluoroplex'] },
  { name: 'Simvastatin', category: 'Statin / Lipid-lowering', aliases: ['Zocor'] },
  { name: 'Azathioprine', category: 'Immunosuppressant', aliases: ['Imuran', 'Azasan'] },
  { name: 'Tramadol', category: 'Analgesic / Opioid', aliases: ['Ultram', 'ConZip', 'Ryzolt'] },
  { name: 'Warfarin', category: 'Anticoagulant', aliases: ['Coumadin', 'Jantoven'] },
  { name: 'Ibuprofen', category: 'NSAID / Analgesic', aliases: ['Advil', 'Motrin', 'Nurofen'] },
  { name: 'Tacrolimus', category: 'Immunosuppressant', aliases: ['Prograf', 'Astagraf', 'Envarsus'] },
  { name: 'Atorvastatin', category: 'Statin / Lipid-lowering', aliases: ['Lipitor'] },
  { name: 'Rosuvastatin', category: 'Statin / Lipid-lowering', aliases: ['Crestor'] },
  { name: 'Fluoxetine', category: 'Antidepressant', aliases: ['Prozac', 'Sarafem'] },
  { name: 'Amitriptyline', category: 'Antidepressant', aliases: ['Elavil'] },
  { name: 'Sertraline', category: 'Antidepressant', aliases: ['Zoloft'] },
  { name: 'Escitalopram', category: 'Antidepressant', aliases: ['Lexapro'] },
  { name: 'Omeprazole', category: 'Proton Pump Inhibitor', aliases: ['Prilosec'] },
  { name: 'Pantoprazole', category: 'Proton Pump Inhibitor', aliases: ['Protonix'] }
];

// Description dictionary for the genes
const GENE_INFO: Record<GeneType, string> = {
  CYP2D6: 'Metabolizes ~25% of clinical drugs including codeine, tramadol, and tamoxifen.',
  CYP2C19: 'Responsible for metabolizing clopidogrel (Plavix), PPIs, and certain antidepressants.',
  CYP2C9: 'Key metabolizer of warfarin, phenytoin, and standard NSAIDs like ibuprofen.',
  CYP3A5: 'Affects clearance of immunosuppressants like tacrolimus.',
  VKORC1: 'The direct molecular target of warfarin; variants control dosage sensitivity.',
  SLCO1B1: 'Controls hepatic uptake of statins; key variant linked to statin-induced myopathy.',
  TPMT: 'Metabolizes thiopurine immunosuppressants such as azathioprine.',
  DPYD: 'Clears fluorouracil chemotherapy; deficiency poses extreme systemic toxicity risk.'
};

export default function LeftPanel({
  patientId,
  onChangePatientId,
  selectedGene,
  onChangeGene,
  selectedPhenotype,
  onChangePhenotype,
  selectedAgeGroup,
  onChangeAgeGroup,
  drugInput,
  onChangeDrug,
  onGenerate,
  isLoading,
  isLimitReached = false,
  onOpenUpgradeModal
}: LeftPanelProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentDrugs, setRecentDrugs] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent drugs from local storage on mount
  useEffect(() => {
    const loaded = localStorage.getItem('pharmagenie_recent_drugs');
    if (loaded) {
      try {
        setRecentDrugs(JSON.parse(loaded));
      } catch (e) {
        console.error('Failed to load recent drugs:', e);
      }
    }
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter popular drugs based on current typing input
  const getFilteredDrugs = () => {
    if (!drugInput.trim()) return POPULAR_DRUGS;
    
    const query = drugInput.toLowerCase().trim();
    return POPULAR_DRUGS.filter(drug => {
      const nameMatch = drug.name.toLowerCase().includes(query);
      const categoryMatch = drug.category.toLowerCase().includes(query);
      const aliasMatch = drug.aliases.some(alias => alias.toLowerCase().includes(query));
      return nameMatch || categoryMatch || aliasMatch;
    });
  };

  const handleSelectDrugOption = (drugName: string) => {
    onChangeDrug(drugName);
    setDropdownOpen(false);
  };

  const handleQuickSelectDrug = (drugName: string) => {
    onChangeDrug(drugName);
    setDropdownOpen(false);
  };

  const handleClearInput = () => {
    onChangeDrug('');
    setDropdownOpen(true);
  };

  const handleGenerateClick = () => {
    if (isLimitReached) {
      if (onOpenUpgradeModal) onOpenUpgradeModal();
      return;
    }
    if (!drugInput.trim()) return;
    
    // Save to recents
    const normalized = drugInput.trim();
    const updated = [
      normalized,
      ...recentDrugs.filter(d => d.toLowerCase() !== normalized.toLowerCase())
    ].slice(0, 5);
    
    setRecentDrugs(updated);
    localStorage.setItem('pharmagenie_recent_drugs', JSON.stringify(updated));
    
    // Call parent generate
    onGenerate();
  };

  const handleClearRecents = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentDrugs([]);
    localStorage.removeItem('pharmagenie_recent_drugs');
  };

  const filteredDrugs = getFilteredDrugs();
  const showCustomOption = drugInput.trim().length > 0 && 
    !POPULAR_DRUGS.some(d => d.name.toLowerCase() === drugInput.trim().toLowerCase());

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full transition-colors duration-200" id="input-controls-panel">
      <div>
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/85">
          <div className="bg-teal-50 dark:bg-teal-950/40 p-1.5 rounded-lg text-teal-600 dark:text-teal-400">
            <Settings2 className="w-4.5 h-4.5" />
          </div>
          <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-wider font-display">
            Clinical Configuration Variables
          </h2>
        </div>

        {/* 1. SELECT GENE */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Dna className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            1. Target Gene Variant
          </label>
          <select
            value={selectedGene}
            onChange={(e) => onChangeGene(e.target.value as GeneType)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-3 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer"
            id="gene-select"
          >
            {GENES.map((gene) => (
              <option key={gene} value={gene} className="dark:bg-slate-900">
                {gene}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-1">
            {GENE_INFO[selectedGene]}
          </p>
        </div>

        {/* 2. SELECT PHENOTYPE */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            2. Patient Phenotype / Metabolic Profile
          </label>
          <select
            value={selectedPhenotype}
            onChange={(e) => onChangePhenotype(e.target.value as PhenotypeType)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-3 focus:ring-teal-500/10 focus:border-teal-500 transition-all cursor-pointer"
            id="phenotype-select"
          >
            {PHENOTYPES.map((phenotype) => (
              <option key={phenotype} value={phenotype} className="dark:bg-slate-900">
                {phenotype}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-1">
            Describes the functional enzymatic activity of the gene variant for metabolic processing.
          </p>
        </div>

        {/* 3. PATIENT ID & CASE REFERENCE */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <User className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            3. Patient ID / Case Reference
          </label>
          <div className="relative">
            <input
              type="text"
              value={patientId}
              onChange={(e) => onChangePatientId(e.target.value)}
              placeholder="e.g. PAT-9842, John Doe"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-3 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
              id="patient-id-input"
            />
            <button
              type="button"
              onClick={() => onChangePatientId(`PAT-${Math.floor(1000 + Math.random() * 9000)}`)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/60 px-2 py-1 rounded-md transition-all cursor-pointer border border-teal-200/50 dark:border-teal-800/80"
              title="Regenerate anonymous Patient ID"
            >
              Regen
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-1">
            Identify your saved sessions with specific patient trackers or case references.
          </p>
        </div>

        {/* 4. PATIENT AGE GROUP */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <User className="w-4 h-4 text-teal-500 dark:text-teal-400" />
            4. Patient Age Group
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-100/60 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
            {(['Pediatric', 'Adult', 'Geriatric'] as AgeGroupType[]).map((age) => {
              const isSelected = selectedAgeGroup === age;
              return (
                <button
                  key={age}
                  type="button"
                  onClick={() => onChangeAgeGroup(age)}
                  className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200/40 dark:border-slate-700/60 font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  id={`age-group-btn-${age.toLowerCase()}`}
                >
                  {age}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[36px] font-medium pl-1">
            {selectedAgeGroup === 'Pediatric' && '👶 Pediatric: Immature clearance/enzymes. Requires weight-based precautions.'}
            {selectedAgeGroup === 'Adult' && '👤 Adult: Standard dosing & full-scale enzymatic clearance capacity.'}
            {selectedAgeGroup === 'Geriatric' && '👵 Geriatric: Reduced organ reserve. High risk of adverse events.'}
          </p>
        </div>

        {/* 5. SEARCHABLE DRUG SELECTOR */}
        <div className="mb-6 relative" ref={dropdownRef}>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center justify-between gap-1.5">
            <span className="flex items-center gap-1.5">
              <Beaker className="w-4 h-4 text-teal-500 dark:text-teal-400" />
              5. Target Drug / Medication
            </span>
            <span className="text-[9px] text-teal-750 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-100/60 dark:border-teal-900/30 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
              Smart Autocomplete
            </span>
          </label>
          
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={drugInput}
              onFocus={() => setDropdownOpen(true)}
              onChange={(e) => {
                onChangeDrug(e.target.value);
                setDropdownOpen(true);
              }}
              placeholder="Search by generic, brand alias, or class..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-3 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
              id="drug-input-field"
            />
            {drugInput ? (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <ChevronDown className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {dropdownOpen && (
            <div 
              className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl z-50 max-h-76 overflow-y-auto p-2.5 space-y-3"
              id="drug-autocomplete-dropdown"
            >
              {/* Recent selections */}
              {recentDrugs.length > 0 && !drugInput.trim() && (
                <div>
                  <div className="flex items-center justify-between px-2 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      Recent Selections
                    </span>
                    <button
                      type="button"
                      onClick={handleClearRecents}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-450 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {recentDrugs.map((drug, index) => (
                      <button
                        key={`${drug}-${index}`}
                        type="button"
                        onClick={() => handleSelectDrugOption(drug)}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        <span>{drug}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Autocomplete items */}
              <div>
                <span className="block px-2 pb-1.5 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  {drugInput.trim() ? 'Search Matches' : 'Popular Reference Medications'}
                </span>
                
                {showCustomOption && (
                  <button
                    type="button"
                    onClick={() => handleSelectDrugOption(drugInput)}
                    className="w-full text-left px-2.5 py-2 mb-1.5 bg-teal-50/45 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-900/40 border border-dashed border-teal-200 dark:border-teal-800 text-xs font-bold text-teal-800 dark:text-teal-350 rounded-xl transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Use custom medication: "{drugInput}"</span>
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400">Custom</span>
                  </button>
                )}

                {filteredDrugs.length === 0 ? (
                  !showCustomOption && (
                    <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                      No matching medications found.
                    </div>
                  )
                ) : (
                  <div className="space-y-0.5">
                    {filteredDrugs.map((drug) => {
                      const isExactMatch = drugInput.toLowerCase() === drug.name.toLowerCase();
                      return (
                        <button
                          key={drug.name}
                          type="button"
                          onClick={() => handleSelectDrugOption(drug.name)}
                          className={`w-full text-left px-2.5 py-2 text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex flex-col justify-start gap-0.5 cursor-pointer relative ${
                            isExactMatch ? 'bg-teal-50/30 dark:bg-teal-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{drug.name}</span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                              {drug.category}
                            </span>
                          </div>
                          {drug.aliases && drug.aliases.length > 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-405 font-medium truncate">
                              Brand Names: {drug.aliases.join(', ')}
                            </span>
                          )}
                          {isExactMatch && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-600 dark:text-teal-400">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium pl-1 leading-relaxed">
            Search or select standard medications. If a branded name like <strong className="text-slate-600 dark:text-slate-350">Plavix</strong>, <strong className="text-slate-600 dark:text-slate-350">Prozac</strong>, or <strong className="text-slate-600 dark:text-slate-350">Advil</strong> is entered, we auto-resolve it to its active clinical counterpart.
          </p>

          <div className="mt-4">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 pl-1">
              Quick Select Reference Drugs:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DRUGS.map((d) => {
                const isActive = drugInput.toLowerCase() === d.name.toLowerCase();
                return (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => handleQuickSelectDrug(d.name)}
                    className={`text-xs px-3 py-2 rounded-lg border transition-all font-semibold cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    id={`quick-drug-${d.name}`}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* GENERATE BUTTON */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
        <motion.button
          type="button"
          onClick={handleGenerateClick}
          disabled={!isLimitReached && (isLoading || !drugInput.trim())}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
            !isLimitReached && (isLoading || !drugInput.trim())
              ? 'bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
              : isLimitReached
              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-750 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/40 cursor-pointer'
              : 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-50 active:translate-y-px cursor-pointer border border-transparent'
          }`}
          id="generate-explanation-button"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4.5 h-4.5 animate-spin text-teal-400" />
              <span>Analyzing Variant Metabolism...</span>
            </>
          ) : isLimitReached ? (
            <>
              <Lock className="w-4.5 h-4.5 text-rose-500 animate-pulse shrink-0" />
              <span>You have reached your monthly report limit.</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5 text-teal-400 dark:text-teal-500 animate-pulse" />
              <span>Generate Clinical Explanation</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </>
          )}
        </motion.button>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-3 font-semibold">
          AI queries utilize grounded medical context references for patient safety.
          Custom entered medications undergo full semantic matching.
        </p>
      </div>
    </div>
  );
}
