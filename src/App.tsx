import { useState, useEffect } from 'react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import PresetCards from './components/PresetCards';
import SavedReportsHistory from './components/SavedReportsHistory';
import { GeneType, PhenotypeType, RiskLevel, GuidelineStatus, PresetCase, AgeGroupType } from './types';
import { getGuidelineInfo } from './data/guidelines';
import { HelpCircle, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { saveReport, SavedReport } from './lib/firebase';

export default function App() {
  const [selectedGene, setSelectedGene] = useState<GeneType>('CYP2D6');
  const [selectedPhenotype, setSelectedPhenotype] = useState<PhenotypeType>('Poor Metabolizer');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<AgeGroupType>('Adult');
  const [drugInput, setDrugInput] = useState<string>('Codeine');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>('c1');

  // Response states
  const [explanation, setExplanation] = useState<string>('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('High Risk');
  const [guidelineStatus, setGuidelineStatus] = useState<GuidelineStatus>('CPIC/PharmGKB Guideline Exists');
  const [evidenceLevel, setEvidenceLevel] = useState<string>('Strong Evidence (CPIC Level A)');
  const [suggestedAlternative, setSuggestedAlternative] = useState<string>('');
  const [source, setSource] = useState<string>('Pre-cached Clinical Guidelines Database');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Firestore integration states
  const [sessionId, setSessionId] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Initialize unique browser sessionId on mount
  useEffect(() => {
    let sid = localStorage.getItem('pharmagenie_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pharmagenie_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Load a preset case
  const handleSelectCase = (caseItem: PresetCase) => {
    setSelectedGene(caseItem.gene);
    setSelectedPhenotype(caseItem.phenotype);
    setDrugInput(caseItem.drug);
    setSelectedCaseId(caseItem.id);
    
    // Clear old result or load immediately from offline guidelines helper to keep UI instantly snappy
    const info = getGuidelineInfo(caseItem.gene, caseItem.phenotype, caseItem.drug);
    setRiskLevel(info.riskLevel);
    setGuidelineStatus(info.guidelineStatus);
    setEvidenceLevel(info.evidenceLevel);
    setSuggestedAlternative(info.suggestedAlternative || '');
    setExplanation(info.defaultSummary);
    setSource('Pre-cached Clinical Guidelines Database');
    setIsSaved(false);
    setError(null);
  };

  // Generate real clinical explanation using our backend proxy (Gemini AI model)
  const handleGenerate = async () => {
    if (!drugInput.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSelectedCaseId(null); // Custom selection
    setIsSaved(false);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gene: selectedGene,
          phenotype: selectedPhenotype,
          drug: drugInput.trim(),
          ageGroup: selectedAgeGroup,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate clinical assessment: Status ${response.status}`);
      }

      const data = await response.json();
      setExplanation(data.explanation);
      setRiskLevel(data.riskLevel);
      setGuidelineStatus(data.guidelineStatus);
      setEvidenceLevel(data.evidenceLevel || 'No Established Guideline');
      setSuggestedAlternative(data.suggestedAlternative || '');
      setSource(data.source || 'Gemini AI Model (gemini-3.5-flash)');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected server error occurred.');
      
      // Snappy fallback to pre-cached guidelines if the backend or API key fails
      const fallback = getGuidelineInfo(selectedGene, selectedPhenotype, drugInput.trim());
      setExplanation(`${fallback.defaultSummary}\n\n[System Note: Fallback pre-cached information loaded due to network limits]`);
      setRiskLevel(fallback.riskLevel);
      setGuidelineStatus(fallback.guidelineStatus);
      setEvidenceLevel(fallback.evidenceLevel);
      setSuggestedAlternative(fallback.suggestedAlternative || '');
      setSource('Pre-cached Clinical Guidelines Database (Fallback Mode)');
    } finally {
      setIsLoading(false);
    }
  };

  // Save report to Firestore database
  const handleSaveReport = async () => {
    if (isSaved || !explanation || !sessionId) return;
    setIsSaving(true);
    try {
      await saveReport({
        gene: selectedGene,
        phenotype: selectedPhenotype,
        drug: drugInput.trim(),
        riskLevel,
        guidelineStatus,
        evidenceLevel,
        suggestedAlternative,
        explanation,
        sessionId,
        ageGroup: selectedAgeGroup
      });
      setIsSaved(true);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to save assessment to database:', err);
      alert('Failed to save report to Firestore database. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Load a previously saved report from the history table
  const handleLoadSavedReport = (report: SavedReport) => {
    setSelectedGene(report.gene as GeneType);
    setSelectedPhenotype(report.phenotype as PhenotypeType);
    setDrugInput(report.drug);
    if (report.ageGroup) {
      setSelectedAgeGroup(report.ageGroup as AgeGroupType);
    } else {
      setSelectedAgeGroup('Adult');
    }
    setSelectedCaseId(null);
    setExplanation(report.explanation);
    setRiskLevel(report.riskLevel as RiskLevel);
    setGuidelineStatus(report.guidelineStatus as GuidelineStatus);
    setEvidenceLevel(report.evidenceLevel);
    setSuggestedAlternative(report.suggestedAlternative || '');
    setSource('Cloud Database (Loaded from History)');
    
    // Defer resetting to true on next tick to avoid local input change hooks toggling it off
    setTimeout(() => {
      setIsSaved(true);
    }, 50);
  };

  // Run on initial mount to populate the default template case
  useEffect(() => {
    const info = getGuidelineInfo('CYP2D6', 'Poor Metabolizer', 'Codeine');
    setRiskLevel(info.riskLevel);
    setGuidelineStatus(info.guidelineStatus);
    setEvidenceLevel(info.evidenceLevel);
    setSuggestedAlternative(info.suggestedAlternative || '');
    setExplanation(info.defaultSummary);
    setSource('Pre-cached Clinical Guidelines Database');
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900" id="pharmagenie-app-root">
      {/* Clinically Polished Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Preset Cards for Demo */}
        <PresetCards 
          onSelectCase={handleSelectCase} 
          selectedCaseId={selectedCaseId} 
        />

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs text-rose-800 font-semibold flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
              <span>
                <strong>Network Notice:</strong> {error}. Using pre-cached high-quality medical databases instead.
              </span>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 bg-white border border-rose-200 rounded"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Two-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Panel (Inputs) */}
          <div className="lg:col-span-5 h-full">
            <LeftPanel
              selectedGene={selectedGene}
              onChangeGene={(gene) => {
                setSelectedGene(gene);
                setSelectedCaseId(null);
                setIsSaved(false);
              }}
              selectedPhenotype={selectedPhenotype}
              onChangePhenotype={(phenotype) => {
                setSelectedPhenotype(phenotype);
                setSelectedCaseId(null);
                setIsSaved(false);
              }}
              selectedAgeGroup={selectedAgeGroup}
              onChangeAgeGroup={(ageGroup) => {
                setSelectedAgeGroup(ageGroup);
                setSelectedCaseId(null);
                setIsSaved(false);
              }}
              drugInput={drugInput}
              onChangeDrug={(drug) => {
                setDrugInput(drug);
                setSelectedCaseId(null);
                setIsSaved(false);
              }}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </div>

          {/* Right Panel (Generated Clinical Outputs) */}
          <div className="lg:col-span-7 h-full">
            <RightPanel
              gene={selectedGene}
              phenotype={selectedPhenotype}
              drug={drugInput}
              riskLevel={riskLevel}
              guidelineStatus={guidelineStatus}
              evidenceLevel={evidenceLevel}
              suggestedAlternative={suggestedAlternative}
              explanation={explanation}
              isLoading={isLoading}
              source={source}
              onSaveReport={handleSaveReport}
              isSaving={isSaving}
              isSaved={isSaved}
            />
          </div>
        </div>

        {/* Persistent Firestore Saved History Table */}
        {sessionId && (
          <SavedReportsHistory
            sessionId={sessionId}
            onLoadReport={handleLoadSavedReport}
            refreshTrigger={refreshTrigger}
          />
        )}

        {/* Quick references guidelines explanation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Understanding Pharmacogenomics Guidelines
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pharmacogenomics (PGx) guidelines from the <strong>Clinical Pharmacogenetics Implementation Consortium (CPIC®)</strong> and <strong>PharmGKB®</strong> are based on extensive, peer-reviewed clinical trial evidence. These guidelines help doctors translate genotype testing results into actionable prescribing decisions, helping to maximize efficacy and prevent severe adverse reactions before they start.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-11 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between text-[11px] text-slate-400 font-medium">
        <div>Sourced from CPIC® V3.2 & PharmGKB® Guidelines Mapping</div>
        <div className="flex gap-4">
          <span>Database Version: 2026.1</span>
          <span className="text-teal-400">● Core Node Optimal</span>
        </div>
      </footer>
    </div>
  );
}
