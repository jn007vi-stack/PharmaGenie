import React from 'react';
import { GENES, PHENOTYPES, DRUGS } from '../data/guidelines';
import { GeneType, PhenotypeType, AgeGroupType } from '../types';
import { Activity, Beaker, Dna, ArrowRight, RefreshCw, Sparkles, User } from 'lucide-react';

interface LeftPanelProps {
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
}

// Quick description dictionary for the genes
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
  selectedGene,
  onChangeGene,
  selectedPhenotype,
  onChangePhenotype,
  selectedAgeGroup,
  onChangeAgeGroup,
  drugInput,
  onChangeDrug,
  onGenerate,
  isLoading
}: LeftPanelProps) {

  const handleQuickSelectDrug = (drugName: string) => {
    onChangeDrug(drugName);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between h-full" id="input-controls-panel">
      <div>
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
          <Activity className="w-5 h-5 text-teal-600" />
          <h2 className="font-semibold text-slate-800 text-base">
            Clinical Configuration & Variables
          </h2>
        </div>

        {/* 1. SELECT GENE */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Dna className="w-4 h-4 text-slate-400" />
            1. Target Gene Variant
          </label>
          <select
            value={selectedGene}
            onChange={(e) => onChangeGene(e.target.value as GeneType)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer"
            id="gene-select"
          >
            {GENES.map((gene) => (
              <option key={gene} value={gene}>
                {gene}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-slate-500 italic leading-relaxed">
            {GENE_INFO[selectedGene]}
          </p>
        </div>

        {/* 2. SELECT PHENOTYPE */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-slate-400" />
            2. Patient Phenotype / Metabolic Profile
          </label>
          <div className="space-y-1.5">
            <select
              value={selectedPhenotype}
              onChange={(e) => onChangePhenotype(e.target.value as PhenotypeType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition-all cursor-pointer"
              id="phenotype-select"
            >
              {PHENOTYPES.map((phenotype) => (
                <option key={phenotype} value={phenotype}>
                  {phenotype}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
            Describes the functional enzymatic activity of the gene variant for metabolic processing.
          </p>
        </div>

        {/* 3. PATIENT AGE GROUP */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-slate-400" />
            3. Patient Age Group
          </label>
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
            {(['Pediatric', 'Adult', 'Geriatric'] as AgeGroupType[]).map((age) => {
              const isSelected = selectedAgeGroup === age;
              return (
                <button
                  key={age}
                  type="button"
                  onClick={() => onChangeAgeGroup(age)}
                  className={`py-2 text-xs font-semibold rounded-md transition-all cursor-pointer text-center ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  id={`age-group-btn-${age.toLowerCase()}`}
                >
                  {age}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed min-h-[32px] font-medium">
            {selectedAgeGroup === 'Pediatric' && '👶 Pediatric: Immature clearance/enzymes. Requires weight-based precautions.'}
            {selectedAgeGroup === 'Adult' && '👤 Adult: Standard clinical guideline dosing & full-scale enzymatic clearance capacity.'}
            {selectedAgeGroup === 'Geriatric' && '👵 Geriatric: Reduced organ reserve and clearance rates. High risk of adverse events.'}
          </p>
        </div>

        {/* 4. SELECT OR ENTER DRUG */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between gap-1.5">
            <span className="flex items-center gap-1.5">
              <Beaker className="w-4 h-4 text-slate-400" />
              4. Target Drug / Medication
            </span>
            <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50 font-bold uppercase tracking-wide">
              Supports Custom Text Input
            </span>
          </label>
          
          <input
            type="text"
            value={drugInput}
            onChange={(e) => onChangeDrug(e.target.value)}
            placeholder="Type any custom drug name (e.g. Prozac, Ibuprofen, Warfarin)"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition-all"
            id="drug-input-field"
          />
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Type any standard medication of your choice, or select from the pre-indexed clinical reference drugs below.
          </p>

          <div className="mt-4">
            <span className="block text-xs font-semibold text-slate-500 mb-2">
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
                    className={`text-xs px-2.5 py-1.5 rounded border transition-all font-medium ${
                      isActive
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
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
      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading || !drugInput.trim()}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-xs ${
            isLoading || !drugInput.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
              : 'bg-slate-950 text-white hover:bg-slate-900 active:translate-y-px cursor-pointer border border-transparent'
          }`}
          id="generate-explanation-button"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
              <span>Analyzing Variant Metabolism...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4.5 h-4.5 text-teal-400" />
              <span>Generate Clinical Explanation</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </>
          )}
        </button>
        <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
          Queries will use the Gemini 3.5 model with direct clinical reference grounding.
        </p>
      </div>
    </div>
  );
}
