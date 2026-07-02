import React, { useEffect, useState } from 'react';
import { getSavedReports, deleteSavedReport, saveReport, SavedReport } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { 
  History, 
  Trash2, 
  Calendar, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Scale, 
  Copy, 
  Search, 
  ArrowUpDown, 
  X, 
  CheckCircle2, 
  Dna, 
  Activity, 
  Beaker, 
  User,
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SavedReportsHistoryProps {
  sessionId: string;
  onLoadReport: (report: SavedReport) => void;
  refreshTrigger: number;
  onReportsChange?: (reports: SavedReport[]) => void;
}

type SortField = 'date' | 'patientId' | 'gene' | 'drug' | 'riskLevel';
type SortOrder = 'asc' | 'desc';

export default function SavedReportsHistory({ sessionId, onLoadReport, refreshTrigger, onReportsChange }: SavedReportsHistoryProps) {
  const { info, success, warning } = useToast();
  const { currentUser, subscriptionTier, setUpgradeModalOpen } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Propagate reports state changes back to parent
  useEffect(() => {
    if (onReportsChange) {
      onReportsChange(reports);
    }
  }, [reports, onReportsChange]);

  // Search & Sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Compare states
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Duplicate states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [reportToDuplicate, setReportToDuplicate] = useState<SavedReport | null>(null);
  const [dupPatientId, setDupPatientId] = useState('');
  const [duplicating, setDuplicating] = useState(false);

  // Delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<SavedReport | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReports = async (isManual = false) => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await getSavedReports(sessionId, currentUser?.uid);
      setReports(data);
      setError(null);
      if (isManual) {
        info("Session Synced: Local dashboard updated with cloud records.");
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Could not retrieve reports history from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(refreshTrigger > 0);
  }, [sessionId, refreshTrigger, currentUser]);

  const handleOpenReport = (report: SavedReport) => {
    onLoadReport(report);
    // Smooth scroll to top of interpretation results
    const element = document.getElementById('clinical-interpretation-section') || document.getElementById('right-panel-title');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Duplicate handler
  const triggerDuplicate = (report: SavedReport, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportToDuplicate(report);
    setDupPatientId(`${report.patientId} - Copy`);
    setShowDuplicateModal(true);
  };

  const handleDuplicateConfirm = async () => {
    if (!reportToDuplicate || !dupPatientId.trim()) return;
    setDuplicating(true);
    try {
      await saveReport({
        patientId: dupPatientId.trim(),
        gene: reportToDuplicate.gene,
        phenotype: reportToDuplicate.phenotype,
        drug: reportToDuplicate.drug,
        riskLevel: reportToDuplicate.riskLevel,
        guidelineStatus: reportToDuplicate.guidelineStatus,
        evidenceLevel: reportToDuplicate.evidenceLevel,
        suggestedAlternative: reportToDuplicate.suggestedAlternative,
        explanation: reportToDuplicate.explanation,
        sessionId: reportToDuplicate.sessionId,
        ageGroup: reportToDuplicate.ageGroup,
        userId: currentUser?.uid || undefined
      });
      setShowDuplicateModal(false);
      setReportToDuplicate(null);
      success('Record Duplicated: Successfully duplicated the clinical record.');
      fetchReports();
    } catch (err) {
      warning('Error duplicating record. Please try again.');
    } finally {
      setDuplicating(false);
    }
  };

  // Delete handler
  const triggerDelete = (report: SavedReport, e: React.MouseEvent) => {
    e.stopPropagation();
    setReportToDelete(report);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete?.id) return;
    setDeleting(true);
    try {
      await deleteSavedReport(reportToDelete.id);
      setReports((prev) => prev.filter((r) => r.id !== reportToDelete.id));
      setSelectedForCompare((prev) => prev.filter((id) => id !== reportToDelete.id));
      setShowDeleteModal(false);
      setReportToDelete(null);
      success('Report Deleted: The clinical report was permanently deleted.');
    } catch (err) {
      warning('Error deleting report. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Checkbox toggle for comparison
  const handleToggleCompare = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 2) {
        // Limit to 2 for comparison
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Low Risk':
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/30';
      case 'Caution':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/30';
      case 'High Risk':
        return 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/30';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  // Sort toggle helper
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  // Risk priority map for sorting
  const RISK_PRIORITY: Record<string, number> = {
    'High Risk': 4,
    'Caution': 3,
    'Low Risk': 2,
    'Insufficient Data': 1
  };

  // Filter & Sort core logic
  const filteredAndSortedReports = reports
    .filter((report) => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        report.patientId.toLowerCase().includes(term) ||
        report.gene.toLowerCase().includes(term) ||
        report.drug.toLowerCase().includes(term) ||
        report.riskLevel.toLowerCase().includes(term) ||
        (report.phenotype && report.phenotype.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
        comparison = timeA - timeB;
      } else if (sortBy === 'patientId') {
        comparison = a.patientId.localeCompare(b.patientId);
      } else if (sortBy === 'gene') {
        comparison = a.gene.localeCompare(b.gene);
      } else if (sortBy === 'drug') {
        comparison = a.drug.localeCompare(b.drug);
      } else if (sortBy === 'riskLevel') {
        const priorityA = RISK_PRIORITY[a.riskLevel] || 0;
        const priorityB = RISK_PRIORITY[b.riskLevel] || 0;
        comparison = priorityA - priorityB;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get report items selected for comparison
  const compareReports = reports.filter((r) => r.id && selectedForCompare.includes(r.id));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl p-6 shadow-xs" id="saved-reports-history-section">
      
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-start gap-3">
          <div className="bg-teal-50 dark:bg-teal-950/45 p-2.5 rounded-xl text-teal-600 dark:text-teal-400 shadow-3xs shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base font-display flex items-center gap-2">
              <span>Patient Session Records</span>
              <span className="text-xs font-black bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 px-2.5 py-0.5 rounded-full border border-teal-200/50 dark:border-teal-900/30">
                {reports.length} Total
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Securely synchronized, filtered, and action-indexed clinical logs stored in Cloud Firestore.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {selectedForCompare.length > 0 && (
            <button
              onClick={() => {
                if (subscriptionTier === 'free') {
                  setUpgradeModalOpen(true);
                  warning("🔒 Advanced Comparison is a Pro feature. Please upgrade to unlock.");
                } else {
                  setShowCompareModal(true);
                }
              }}
              disabled={selectedForCompare.length !== 2}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border shadow-2xs ${
                selectedForCompare.length === 2
                  ? 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600 font-extrabold'
                  : 'bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>{subscriptionTier === 'free' ? '🔒 ' : ''}Compare Selected ({selectedForCompare.length}/2)</span>
            </button>
          )}

          <button
            onClick={fetchReports}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs"
            title="Force refresh index database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Session</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH AND QUICK FILTER CONTROLS */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-5">
        <div className="sm:col-span-8 relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clinical logs by Patient ID, Gene, Drug, Phenotype or Risk..."
            className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-3 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>
        
        {/* Sort Controls Dropdown */}
        <div className="sm:col-span-4 flex gap-1 bg-slate-100/60 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 p-1 rounded-xl items-center">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider pl-2 shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value as SortField)}
            className="flex-1 bg-transparent border-none text-xs text-slate-700 dark:text-slate-300 font-bold focus:outline-hidden cursor-pointer"
          >
            <option value="date" className="bg-white dark:bg-slate-900">Date Compiled</option>
            <option value="patientId" className="bg-white dark:bg-slate-900">Patient ID</option>
            <option value="gene" className="bg-white dark:bg-slate-900">Gene Variant</option>
            <option value="drug" className="bg-white dark:bg-slate-900">Medication</option>
            <option value="riskLevel" className="bg-white dark:bg-slate-900">Risk Level</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer shadow-3xs"
            title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. TABLE/LIST AREA */}
      {loading && reports.length === 0 ? (
        <div className="py-14 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-600 dark:text-teal-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-400">Synchronizing clinical record database...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300 text-xs rounded-xl font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-450" />
          <span>{error}</span>
        </div>
      ) : filteredAndSortedReports.length === 0 ? (
        <div className="py-14 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20">
          <Layers className="w-9 h-9 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No reports match your query</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
            {searchTerm ? 'Try adjusting your search terms or filters.' : 'Save generated reports in the panel above to view historical logs.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-6 sm:px-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/30">
                  <th className="py-2.5 px-4 font-display text-center w-12">Select</th>
                  <th className="py-2.5 px-4 font-display cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('patientId')}>
                    Patient ID {sortBy === 'patientId' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-2.5 px-4 font-display cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('gene')}>
                    Gene {sortBy === 'gene' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-2.5 px-4 font-display cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('drug')}>
                    Medication {sortBy === 'drug' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-2.5 px-4 font-display cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('riskLevel')}>
                    Risk Actionability {sortBy === 'riskLevel' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-2.5 px-4 hidden md:table-cell font-display cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => handleSort('date')}>
                    Date Compiled {sortBy === 'date' && (sortOrder === 'asc' ? '▲' : '▼')}
                  </th>
                  <th className="py-2.5 px-4 text-right font-display w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredAndSortedReports.map((report) => {
                  const date = report.timestamp?.toDate 
                    ? report.timestamp.toDate().toLocaleDateString()
                    : new Date(report.timestamp).toLocaleDateString();

                  const isChecked = selectedForCompare.includes(report.id || '');

                  return (
                    <motion.tr
                      key={report.id}
                      onClick={() => handleOpenReport(report)}
                      whileHover={{ backgroundColor: "var(--hover-row-bg, rgba(248, 250, 252, 0.75))" }}
                      className="cursor-pointer group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 [--hover-row-bg:rgba(248,250,252,0.75)] dark:[--hover-row-bg:rgba(30,41,59,0.3)]"
                    >
                      {/* Compare Checkbox */}
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleToggleCompare(report.id || '', e as any)}
                          className="w-4 h-4 text-teal-600 border-slate-300 dark:border-slate-700 rounded focus:ring-teal-500 cursor-pointer dark:bg-slate-950"
                          title="Select to compare side-by-side (max 2)"
                        />
                      </td>

                      {/* Patient ID */}
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 h-12">
                        <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate max-w-[120px]" title={report.patientId}>
                          {report.patientId}
                        </span>
                      </td>

                      {/* Gene & Phenotype */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight">{report.gene}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-450 font-semibold truncate max-w-[120px]" title={report.phenotype}>
                            {report.phenotype}
                          </span>
                        </div>
                      </td>

                      {/* Medication / Age */}
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1">
                            <Beaker className="w-3 h-3 text-teal-600 dark:text-teal-400 shrink-0" />
                            {report.drug}
                          </span>
                          {report.ageGroup && (
                            <span className="text-[8px] self-start font-black px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200/50 dark:border-slate-750 uppercase tracking-wide">
                              {report.ageGroup}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Risk */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-wider ${getRiskBadgeColor(report.riskLevel)}`}>
                          {report.riskLevel}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-xs text-slate-400 dark:text-slate-500 hidden md:table-cell font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{date}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenReport(report)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-all cursor-pointer"
                            title="Load report details"
                          >
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-all text-teal-600 dark:text-teal-400" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => triggerDuplicate(report, e)}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all cursor-pointer"
                            title="Duplicate record"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => triggerDelete(report, e)}
                            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all rounded-lg cursor-pointer"
                            title="Delete clinical log"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 4. MODALS (COMPARE, DUPLICATE, DELETE CONFIRMATION)     */}
      {/* ======================================================= */}
      
      {/* COMPARISON MODAL */}
      <AnimatePresence>
        {showCompareModal && compareReports.length === 2 && (() => {
          const repA = compareReports[0];
          const repB = compareReports[1];

          // Compute exact difference flags for highlight parsing
          const isGeneDiff = repA.gene !== repB.gene;
          const isPhenotypeDiff = repA.phenotype !== repB.phenotype;
          const isDrugDiff = repA.drug.toLowerCase().trim() !== repB.drug.toLowerCase().trim();
          const isRiskDiff = repA.riskLevel !== repB.riskLevel;
          const isAltDiff = (repA.suggestedAlternative || '').toLowerCase().trim() !== (repB.suggestedAlternative || '').toLowerCase().trim();
          const isRecDiff = repA.explanation.substring(0, 150).toLowerCase().trim() !== repB.explanation.substring(0, 150).toLowerCase().trim();

          return (
            <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
                id="comparison-modal"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-teal-100 dark:bg-teal-950/60 p-2 rounded-xl text-teal-700 dark:text-teal-400">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">Comparative Genotype Study</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Side-by-side diagnostic mapping and actionability differences.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCompareModal(false)}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/40">
                  
                  {/* Executive Discrepancy & Differences Summary Banner */}
                  <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 rounded-2xl p-5 mb-6 shadow-md border border-slate-800 dark:border-slate-850">
                    <div className="flex items-center gap-2.5 mb-4 border-b border-slate-800 dark:border-slate-900 pb-3">
                      <ArrowRightLeft className="w-5 h-5 text-teal-400" />
                      <div>
                        <h5 className="font-extrabold text-xs tracking-wider uppercase text-slate-200 dark:text-slate-300">
                          Active Discrepancy & Comparative Analysis
                        </h5>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          Automated evaluation of diagnostic alignment, risk variances, and alternative prescribing directions.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs">
                      {/* 1. GENE DIFF */}
                      <div className={`p-3 rounded-xl border ${isGeneDiff ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-slate-850/45 dark:bg-slate-900/40 border-slate-800 dark:border-slate-850 text-slate-300 dark:text-slate-400'}`}>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Gene Variant</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Dna className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                          <span className="font-mono">{repA.gene} vs {repB.gene}</span>
                        </div>
                        <span className={`inline-block mt-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isGeneDiff ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'}`}>
                          {isGeneDiff ? 'Different Genes' : 'Aligned Gene'}
                        </span>
                      </div>

                      {/* 2. DRUG DIFF */}
                      <div className={`p-3 rounded-xl border ${isDrugDiff ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-slate-850/45 dark:bg-slate-900/40 border-slate-800 dark:border-slate-850 text-slate-300 dark:text-slate-400'}`}>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Target Drug</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Beaker className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                          <span className="truncate" title={`${repA.drug} vs ${repB.drug}`}>{repA.drug} vs {repB.drug}</span>
                        </div>
                        <span className={`inline-block mt-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isDrugDiff ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'}`}>
                          {isDrugDiff ? 'Different Drugs' : 'Aligned Drugs'}
                        </span>
                      </div>

                      {/* 3. RISK LEVEL DIFF */}
                      <div className={`p-3 rounded-xl border ${isRiskDiff ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' : 'bg-slate-850/45 dark:bg-slate-900/40 border-slate-800 dark:border-slate-850 text-slate-300 dark:text-slate-400'}`}>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Risk Severity</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Activity className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                          <span className="truncate">{repA.riskLevel} vs {repB.riskLevel}</span>
                        </div>
                        <span className={`inline-block mt-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isRiskDiff ? 'bg-rose-500/25 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'}`}>
                          {isRiskDiff ? 'Risk Mismatch' : 'Aligned Risk'}
                        </span>
                      </div>

                      {/* 4. CLINICAL RECOMMENDATIONS DIFF */}
                      <div className={`p-3 rounded-xl border ${isRecDiff ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200' : 'bg-slate-850/45 dark:bg-slate-900/40 border-slate-800 dark:border-slate-850 text-slate-300 dark:text-slate-400'}`}>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Recommendations</span>
                        <div className="flex items-center gap-1.5 font-bold truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                          <span>Metabolic Guidance</span>
                        </div>
                        <span className={`inline-block mt-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isRecDiff ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'}`}>
                          {isRecDiff ? 'Varying Guidelines' : 'Aligned Guidance'}
                        </span>
                      </div>

                      {/* 5. ALTERNATIVE THERAPIES DIFF */}
                      <div className={`p-3 rounded-xl border ${isAltDiff ? 'bg-teal-950/20 border-teal-500/30 text-teal-200' : 'bg-slate-850/45 dark:bg-slate-900/40 border-slate-800 dark:border-slate-850 text-slate-300 dark:text-slate-400'}`}>
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Alternative Therapies</span>
                        <div className="flex items-center gap-1.5 font-bold truncate">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                          <span>Alternatives List</span>
                        </div>
                        <span className={`inline-block mt-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isAltDiff ? 'bg-teal-500/25 text-teal-300 border border-teal-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'}`}>
                          {isAltDiff ? 'Varying Alternatives' : 'Aligned Alternatives'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-side Patient Panels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[repA, repB].map((rep, idx) => {
                      const isCompanion = idx === 0 ? repB : repA;
                      return (
                        <div key={rep.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col gap-5 relative overflow-hidden">
                          {/* Top Visual Corner Tag */}
                          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-teal-500 to-indigo-500" />

                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4 text-slate-400 dark:text-slate-550" />
                              <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Patient {idx + 1} Profile:</span>
                              <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                                {rep.patientId}
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-wider ${getRiskBadgeColor(rep.riskLevel)} ${isRiskDiff ? 'ring-2 ring-rose-500/20' : ''}`}>
                                {rep.riskLevel}
                              </span>
                              {isRiskDiff && (
                                <span className="text-[8px] text-rose-500 font-bold mt-1 flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Risk Discrepancy
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs pb-4 border-b border-slate-100 dark:border-slate-800/80">
                            {/* Gene Variant */}
                            <div className={`p-2.5 rounded-xl transition-all ${isGeneDiff ? 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30' : 'bg-slate-50/40 dark:bg-slate-950/30'}`}>
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider mb-0.5">Gene Variant</span>
                              <span className="font-black text-slate-900 dark:text-slate-100 font-mono text-sm block">{rep.gene}</span>
                              <span className="block text-slate-600 dark:text-slate-400 font-bold mt-0.5 leading-tight">{rep.phenotype}</span>
                              {isGeneDiff && (
                                <span className="text-[9px] text-amber-700 dark:text-amber-400 font-extrabold mt-1.5 block bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 rounded px-1.5 py-0.5">
                                  Companion: {isCompanion.gene}
                                </span>
                              )}
                            </div>

                            {/* Target Medication */}
                            <div className={`p-2.5 rounded-xl transition-all ${isDrugDiff ? 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30' : 'bg-slate-50/40 dark:bg-slate-950/30'}`}>
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider mb-0.5">Medication / Class</span>
                              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-1 mt-0.5">
                                <Beaker className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                {rep.drug}
                              </span>
                              {rep.ageGroup && (
                                <span className="inline-block text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450 border border-slate-200/50 dark:border-slate-700 px-1.5 py-0.2 rounded mt-1">
                                  {rep.ageGroup}
                                </span>
                              )}
                              {isDrugDiff && (
                                <span className="text-[9px] text-amber-700 dark:text-amber-400 font-extrabold mt-1.5 block bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 rounded px-1.5 py-0.5">
                                  Companion: {isCompanion.drug}
                                </span>
                              )}
                            </div>

                            {/* Level of Evidence */}
                            <div className="p-2.5 rounded-xl bg-slate-50/40 dark:bg-slate-950/30">
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider mb-1">Level of Evidence</span>
                              <span className="font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 px-2 py-0.5 rounded-md inline-block">
                                {rep.evidenceLevel}
                              </span>
                            </div>

                            {/* Guideline Status */}
                            <div className="p-2.5 rounded-xl bg-slate-50/40 dark:bg-slate-950/30">
                              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider mb-1">Mapping Source</span>
                              <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2.5 py-0.5 rounded-md inline-block truncate max-w-full" title={rep.guidelineStatus}>
                                {rep.guidelineStatus}
                              </span>
                            </div>
                          </div>

                          {/* Suggested Alternative */}
                          <div className={`p-4 rounded-xl border transition-all ${isAltDiff ? 'bg-teal-50/70 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/40 ring-2 ring-teal-500/10' : 'bg-teal-50/30 dark:bg-teal-950/10 border-teal-100 dark:border-teal-950'}`}>
                            <span className="block text-[9px] text-teal-850 dark:text-teal-400 font-black uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              Suggested Therapeutic Alternatives
                            </span>
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                              {rep.suggestedAlternative || 'Standard therapy remains indicated. No pharmacogenomic alternatives suggested.'}
                            </p>
                            {isAltDiff && (
                              <div className="mt-2.5 pt-2 border-t border-teal-200/60 dark:border-teal-900/40 text-[9px] text-teal-800 dark:text-teal-400 font-medium">
                                <strong className="font-extrabold uppercase text-[8px] tracking-wider text-teal-900 dark:text-teal-300 block mb-0.5">Companion Alternatives:</strong>
                                {isCompanion.suggestedAlternative || 'No specific alternatives.'}
                              </div>
                            )}
                          </div>

                          {/* Guidance Narrative */}
                          <div className={`flex-1 flex flex-col p-4 rounded-xl border transition-all ${isRecDiff ? 'bg-slate-50/80 dark:bg-slate-950/20 border-indigo-100 dark:border-indigo-900/30' : 'bg-slate-50/30 dark:bg-slate-950/10 border-slate-100 dark:border-slate-850'}`}>
                            <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
                              Therapeutic Metabolism Guidance
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-350 font-medium leading-relaxed max-h-48 overflow-y-auto pr-1">
                              {rep.explanation}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              handleOpenReport(rep);
                              setShowCompareModal(false);
                            }}
                            className="w-full py-2.5 bg-slate-950 dark:bg-slate-100 hover:bg-slate-900 dark:hover:bg-slate-50 text-white dark:text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm border border-transparent"
                          >
                            <span>Load into Active Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Close Button */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 text-right bg-white dark:bg-slate-950">
                  <button
                    onClick={() => setShowCompareModal(false)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl transition-all cursor-pointer text-xs"
                  >
                    Dismiss Comparison
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* DUPLICATE MODAL */}
      <AnimatePresence>
        {showDuplicateModal && reportToDuplicate && (
          <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
              id="duplicate-modal"
            >
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <Copy className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">Duplicate PGx Assessment Log</h4>
              </div>

              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3">
                  This will duplicate the clinical assessment of {reportToDuplicate.gene} - {reportToDuplicate.drug} to a new patient file.
                </p>
                <label className="block text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider mb-1.5">
                  New Patient ID / Case Reference
                </label>
                <input
                  type="text"
                  value={dupPatientId}
                  onChange={(e) => setDupPatientId(e.target.value)}
                  placeholder="e.g. PAT-5042, Case Alpha"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 font-bold focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden focus:ring-3 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={duplicating}
                  onClick={() => {
                    setShowDuplicateModal(false);
                    setReportToDuplicate(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={duplicating || !dupPatientId.trim()}
                  onClick={handleDuplicateConfirm}
                  className="px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs"
                >
                  {duplicating ? 'Duplicating...' : 'Duplicate Record'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteModal && reportToDelete && (
          <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-2xl w-full max-w-md p-6 flex flex-col gap-4"
              id="delete-modal"
            >
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">Purge Patient Clinical Log</h4>
              </div>

              <p className="text-xs text-slate-650 dark:text-slate-400 font-semibold leading-relaxed">
                Are you sure you want to permanently delete the clinical report index for Patient <strong className="text-slate-900 dark:text-slate-100">"{reportToDelete.patientId}"</strong> from the database? This action is irreversible and the synchronized history will be wiped.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setShowDeleteModal(false);
                    setReportToDelete(null);
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold rounded-xl transition-all cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
                >
                  {deleting ? 'Deleting...' : 'Wipe Record'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
