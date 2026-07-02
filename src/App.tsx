import { useState, useEffect } from 'react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import PresetCards from './components/PresetCards';
import SavedReportsHistory from './components/SavedReportsHistory';
import { GeneType, PhenotypeType, RiskLevel, GuidelineStatus, PresetCase, AgeGroupType } from './types';
import { getGuidelineInfo } from './data/guidelines';
import { 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  Layers, 
  Dna, 
  Beaker, 
  AlertTriangle,
  LayoutDashboard,
  FlaskConical,
  History as HistoryIcon,
  User as UserIcon,
  ShieldCheck as ShieldIcon,
  LogOut,
  Sparkles,
  Lock
} from 'lucide-react';
import { saveReport, SavedReport, getSavedReports } from './lib/firebase';
import { useToast } from './components/Toast';
import { useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import DashboardPanel from './components/DashboardPanel';
import UserProfilePage from './components/UserProfilePage';
import AdminDashboard from './components/AdminDashboard';
import UpgradeModal from './components/UpgradeModal';

export default function App() {
  const { success, warning, info } = useToast();
  const { currentUser, loading, logout, userProfile, role, subscriptionTier, setUpgradeModalOpen } = useAuth();
  
  const [currentTab, setCurrentTab] = useState<string>('Dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('pharmagenie_dark_mode', 'true');
  }, []);

  const [patientId, setPatientId] = useState<string>('');
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

  // Analytics & Dashboard states
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [recentDrugs, setRecentDrugs] = useState<string[]>([]);

  const loadRecentDrugs = () => {
    const loaded = localStorage.getItem('pharmagenie_recent_drugs');
    if (loaded) {
      try {
        setRecentDrugs(JSON.parse(loaded));
      } catch (e) {
        console.error('Failed to parse recent drugs:', e);
      }
    }
  };

  const handleUpdateRecentDrugs = (drugName: string) => {
    if (!drugName.trim()) return;
    const normalized = drugName.trim();
    const loaded = localStorage.getItem('pharmagenie_recent_drugs');
    let current: string[] = [];
    if (loaded) {
      try {
        current = JSON.parse(loaded);
      } catch (e) {}
    }
    const updated = [
      normalized,
      ...current.filter(d => d.toLowerCase() !== normalized.toLowerCase())
    ].slice(0, 6);
    localStorage.setItem('pharmagenie_recent_drugs', JSON.stringify(updated));
    setRecentDrugs(updated);
  };

  // Initialize unique browser sessionId and load recents on mount
  useEffect(() => {
    let sid = localStorage.getItem('pharmagenie_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('pharmagenie_session_id', sid);
    }
    setSessionId(sid);
    
    // Load recently accessed drugs
    loadRecentDrugs();

    // Set initial random patient ID
    setPatientId(`PAT-${Math.floor(1000 + Math.random() * 9000)}`);
  }, []);

  // Synchronize reports list to track monthly report counts for the usage limit check
  useEffect(() => {
    async function syncReports() {
      if (!sessionId) return;
      try {
        const list = await getSavedReports(sessionId, currentUser?.uid || undefined);
        setReports(list);
      } catch (err) {
        console.error('Error syncing reports list:', err);
      }
    }
    syncReports();
  }, [sessionId, currentUser, refreshTrigger]);

  // Compute reports generated in the current calendar month
  const reportsCountThisMonth = reports.filter(r => {
    const ts = r.timestamp || r.createdAt;
    if (!ts) return false;
    try {
      const d = new Date(ts);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } catch {
      return false;
    }
  }).length;

  const maxReportsLimit = 10;
  const isLimitReached = subscriptionTier === 'free' && reportsCountThisMonth >= maxReportsLimit;

  // Load a preset case
  const handleSelectCase = (caseItem: PresetCase) => {
    setSelectedGene(caseItem.gene);
    setSelectedPhenotype(caseItem.phenotype);
    setDrugInput(caseItem.drug);
    setSelectedCaseId(caseItem.id);
    
    // Update recent drugs list
    handleUpdateRecentDrugs(caseItem.drug);
    
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
    if (isLimitReached) {
      warning("You have reached your monthly report limit. Please upgrade to Pro.");
      setUpgradeModalOpen(true);
      return;
    }
    if (!drugInput.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSelectedCaseId(null); // Custom selection
    setIsSaved(false);

    // Update recent drugs list
    handleUpdateRecentDrugs(drugInput.trim());

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
      setSource(data.source || 'Gemini AI Model (gemini-2.5-flash)');
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
    if (isLimitReached) {
      warning("You have reached your monthly report limit. Please upgrade to Pro.");
      setUpgradeModalOpen(true);
      return;
    }
    if (isSaved || !explanation || !sessionId) return;
    setIsSaving(true);
    try {
      await saveReport({
        patientId: patientId || `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
        gene: selectedGene,
        phenotype: selectedPhenotype,
        drug: drugInput.trim(),
        riskLevel,
        guidelineStatus,
        evidenceLevel,
        suggestedAlternative,
        explanation,
        sessionId,
        ageGroup: selectedAgeGroup,
        userId: currentUser?.uid || undefined
      });
      setIsSaved(true);
      setRefreshTrigger((prev) => prev + 1);
      success("Report Saved: Clinical PGx report added to history.");
    } catch (err) {
      console.error('Failed to save assessment to database:', err);
      warning("Failed to save report to database. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Load a previously saved report from the history table
  const handleLoadSavedReport = (report: SavedReport) => {
    // Update recent drugs list
    handleUpdateRecentDrugs(report.drug);

    setPatientId(report.patientId || `PAT-${Math.floor(1000 + Math.random() * 9000)}`);
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

  // Compute live professional dashboard metrics
  const uniqueGenesScreened = new Set(reports.map((r) => r.gene)).size;
  const highRiskCount = reports.filter((r) => r.riskLevel === 'High Risk').length;
  const mediumRiskCount = reports.filter((r) => r.riskLevel === 'Caution' || r.riskLevel === 'Medium Risk').length;
  const lowRiskCount = reports.filter((r) => r.riskLevel === 'Low Risk').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-500">
        <Dna className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mb-4" />
        <span className="text-sm font-extrabold font-display">PharmaGenie Loading...</span>
        <span className="text-xs text-slate-400 mt-1 font-semibold">Synchronizing clinical workspace sessions...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200" id="pharmagenie-app-root">
      
      {/* Clinically Polished Header */}
      <Header darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />

      {/* Navigation tabs */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4" id="dashboard-navigation-bar">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-2 rounded-2xl shadow-3xs flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCurrentTab('Dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                currentTab === 'Dashboard'
                  ? 'bg-teal-50 dark:bg-teal-950/35 text-teal-700 dark:text-teal-400 border border-teal-200/30 dark:border-teal-900/40 shadow-3xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('Reports')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                currentTab === 'Reports'
                  ? 'bg-teal-50 dark:bg-teal-950/35 text-teal-700 dark:text-teal-400 border border-teal-200/30 dark:border-teal-900/40 shadow-3xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span>Clinical Workbench</span>
            </button>

            <button
              onClick={() => setCurrentTab('History')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                currentTab === 'History'
                  ? 'bg-teal-50 dark:bg-teal-950/35 text-teal-700 dark:text-teal-400 border border-teal-200/30 dark:border-teal-900/40 shadow-3xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <HistoryIcon className="w-4 h-4 shrink-0" />
              <span>Saved Records Log</span>
            </button>

            <button
              onClick={() => setCurrentTab('Profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                currentTab === 'Profile'
                  ? 'bg-teal-50 dark:bg-teal-950/35 text-teal-700 dark:text-teal-400 border border-teal-200/30 dark:border-teal-900/40 shadow-3xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span>Identity Profile</span>
            </button>

            {role === 'Administrator' && (
              <button
                onClick={() => setCurrentTab('Admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                  currentTab === 'Admin'
                    ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-400 border border-indigo-200/40 dark:border-indigo-900/40 shadow-3xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <ShieldIcon className="w-4 h-4 shrink-0 animate-pulse text-indigo-600 dark:text-indigo-400" />
                <span>Admin Console</span>
              </button>
            )}
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-200/35 cursor-pointer transition-all ml-auto shrink-0"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        
        {currentTab === 'Dashboard' && (
          <DashboardPanel 
            onNavigate={setCurrentTab} 
            onLoadReport={handleLoadSavedReport} 
            refreshTrigger={refreshTrigger} 
          />
        )}

        {currentTab === 'Reports' && (
          <>
            {isLimitReached && (
              <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/40 p-4 rounded-2xl shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2" id="report-limit-banner">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl shrink-0">
                    <ShieldAlert className="w-5 h-5 text-rose-500 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-800 dark:text-rose-450 uppercase tracking-wider">Clinical Workspace Locked</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-400 font-bold mt-0.5 leading-snug">
                      You have reached your monthly report limit (10/10 reports). Upgrade to Pro for unlimited assessments.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUpgradeModalOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Upgrade to Pro Suite</span>
                </button>
              </div>
            )}

            {/* Professional Dashboard Metrics in Reports Workbench */}
            <div className="flex flex-col gap-4" id="professional-dashboard-metrics">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {/* Total Saved Reports */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[105px] hover:border-indigo-200 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Saved Reports</span>
                    <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-indigo-750 dark:text-indigo-450 tracking-tight">{reports.length}</span>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1 leading-none">Synced database records</p>
                  </div>
                </div>

                {/* Genes Screened */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[105px] hover:border-cyan-200 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Genes Screened</span>
                    <div className="p-1.5 bg-cyan-50 dark:bg-cyan-950/40 rounded-lg text-cyan-600 dark:text-cyan-400">
                      <Dna className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-cyan-700 dark:text-cyan-450 tracking-tight">{uniqueGenesScreened}</span>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1 leading-none">Unique variant targets</p>
                  </div>
                </div>

                {/* High Risk Cases */}
                <div className="bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[105px] hover:border-rose-200 dark:hover:border-rose-800 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-rose-500 dark:text-rose-400 tracking-wider">High Risk</span>
                    <div className="p-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">{highRiskCount}</span>
                    <p className="text-[9px] text-rose-500 dark:text-rose-400/80 font-bold mt-1 leading-none">Critical clinical warnings</p>
                  </div>
                </div>

                {/* Medium Risk Cases */}
                <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[105px] hover:border-amber-200 dark:hover:border-amber-800 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">Medium Risk</span>
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{mediumRiskCount}</span>
                    <p className="text-[9px] text-amber-500/85 dark:text-amber-450 font-bold mt-1 leading-none">Dosage adjustments</p>
                  </div>
                </div>

                {/* Low Risk Cases */}
                <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 shadow-3xs flex flex-col justify-between min-h-[105px] hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Low Risk</span>
                    <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{lowRiskCount}</span>
                    <p className="text-[9px] text-emerald-500/85 dark:text-emerald-450 font-bold mt-1 leading-none">Standard metabolic safety</p>
                  </div>
                </div>
              </div>

              {/* Recently Accessed Drugs Chip Track */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-3xs hover:border-teal-100 dark:hover:border-teal-900 transition-all">
                <div className="flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">Recently Accessed Medications:</span>
                </div>
                <div className="flex flex-wrap gap-2 items-center justify-end">
                  {recentDrugs.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium italic">No evaluated drugs yet. Type or select a case below.</span>
                  ) : (
                    recentDrugs.map((drug) => (
                      <button
                        key={drug}
                        onClick={() => {
                          setDrugInput(drug);
                          const info = getGuidelineInfo(selectedGene, selectedPhenotype, drug);
                          setRiskLevel(info.riskLevel);
                          setGuidelineStatus(info.guidelineStatus);
                          setEvidenceLevel(info.evidenceLevel);
                          setSuggestedAlternative(info.suggestedAlternative || '');
                          setExplanation(info.defaultSummary);
                          setSource('Pre-cached Clinical Guidelines Database');
                          setSelectedCaseId(null);
                          setIsSaved(false);
                        }}
                        className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-700 dark:hover:text-teal-400 hover:border-teal-200/60 dark:hover:border-teal-900/60 border border-slate-200/50 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-all flex items-center gap-1 shadow-3xs"
                        title={`Click to analyze ${drug} in active workspace`}
                      >
                        <span>{drug}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Preset Cards for Demo */}
            <PresetCards 
              onSelectCase={handleSelectCase} 
              selectedCaseId={selectedCaseId} 
            />

            {error && (
              <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-4 text-xs text-rose-800 font-bold flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>
                    <strong>Reference Alert:</strong> {error}. Using pre-cached high-quality medical databases instead.
                  </span>
                </div>
                <button 
                  onClick={() => setError(null)} 
                  className="text-rose-600 hover:text-rose-800 font-extrabold px-3 py-1.5 bg-white border border-rose-200 rounded-lg shadow-2xs cursor-pointer transition-all"
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
                  patientId={patientId}
                  onChangePatientId={setPatientId}
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
                  isLimitReached={isLimitReached}
                  onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
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
                  activeGene={selectedGene}
                  activePhenotype={selectedPhenotype}
                  activeDrug={drugInput}
                  activeAgeGroup={selectedAgeGroup}
                  patientId={patientId}
                />
              </div>
            </div>
          </>
        )}

        {currentTab === 'History' && sessionId && (
          <SavedReportsHistory
            sessionId={sessionId}
            onLoadReport={handleLoadSavedReport}
            refreshTrigger={refreshTrigger}
            onReportsChange={setReports}
          />
        )}

        {currentTab === 'Profile' && (
          <UserProfilePage />
        )}

        {currentTab === 'Admin' && role === 'Administrator' && (
          <AdminDashboard />
        )}

        {/* Quick references guidelines explanation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs mt-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2 font-display">
            <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
            Understanding Pharmacogenomics Guidelines
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
            Pharmacogenomics (PGx) guidelines from the <strong>Clinical Pharmacogenetics Implementation Consortium (CPIC®)</strong> and <strong>PharmGKB®</strong> are based on extensive, peer-reviewed clinical trial evidence. These guidelines help healthcare professionals translate genotype testing results into actionable prescribing decisions, helping to maximize drug efficacy, determine optimal dosages, and prevent severe adverse reactions before they start.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
        <div>Sourced from CPIC® V3.2 & PharmGKB® Guidelines Mapping</div>
        <div className="flex gap-4">
          <span>Clinical Reference Portal</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>Database Version 2026.1</span>
        </div>
      </footer>
      <UpgradeModal />
    </div>
  );
}
