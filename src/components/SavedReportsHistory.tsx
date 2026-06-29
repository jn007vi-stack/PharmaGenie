import React, { useEffect, useState } from 'react';
import { getSavedReports, deleteSavedReport, SavedReport } from '../lib/firebase';
import { History, Trash2, Calendar, Clipboard, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { RiskLevel } from '../types';

interface SavedReportsHistoryProps {
  sessionId: string;
  onLoadReport: (report: SavedReport) => void;
  // Triggered when a new report is saved elsewhere so we can refresh the list
  refreshTrigger: number;
}

export default function SavedReportsHistory({ sessionId, onLoadReport, refreshTrigger }: SavedReportsHistoryProps) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await getSavedReports(sessionId);
      setReports(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Could not retrieve reports history from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [sessionId, refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the report when clicking delete
    if (!window.confirm('Are you sure you want to delete this report from history?')) return;
    
    try {
      await deleteSavedReport(id);
      // Optimistically update local state
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert('Error deleting report. Please try again.');
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Low Risk':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Caution':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'High Risk':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm" id="saved-reports-history-section">
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-2 rounded-lg text-slate-700">
            <History className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              Persistent Saved History (Firestore Linked)
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Assessments are saved persistently in the cloud and synced specifically to your browser session.
            </p>
          </div>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
          title="Refresh History List"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading && reports.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-teal-500" />
          <span>Synchronizing cloud history database...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
          {error}
        </div>
      ) : reports.length === 0 ? (
        <div className="py-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
          <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-600 mb-1">No Saved Reports Found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Once you generate a clinical explanation, you can save it securely to your history.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Gene Variant</th>
                <th className="py-3 px-4">Phenotype</th>
                <th className="py-3 px-4">Drug Medication</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4 hidden md:table-cell">Date Saved</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {reports.map((report) => {
                const date = report.timestamp?.toDate 
                  ? report.timestamp.toDate().toLocaleDateString()
                  : new Date(report.timestamp).toLocaleDateString();

                return (
                  <tr
                    key={report.id}
                    onClick={() => onLoadReport(report)}
                    className="hover:bg-slate-50 cursor-pointer group transition-colors"
                  >
                    <td className="py-3 px-4 font-bold font-mono text-slate-800">
                      {report.gene}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium max-w-[150px] truncate" title={report.phenotype}>
                      {report.phenotype}
                    </td>
                    <td className="py-3 px-4 font-semibold text-teal-700">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span>{report.drug}</span>
                        {report.ageGroup && (
                          <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-bold border border-slate-200/50 uppercase tracking-wide">
                            {report.ageGroup}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${getRiskBadgeColor(report.riskLevel)}`}>
                        {report.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden md:table-cell font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {date}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-900 transition-all rounded-md hover:bg-slate-100"
                          title="Load Report to Main Workspace"
                        >
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(report.id!, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-md cursor-pointer"
                          title="Delete from cloud database"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
