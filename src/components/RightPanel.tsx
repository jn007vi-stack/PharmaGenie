import { Copy, Download, Check, AlertCircle, FileText, Info, FolderPlus, Cloud, Printer } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GeneType, PhenotypeType, RiskLevel, GuidelineStatus } from '../types';
import { jsPDF } from 'jspdf';

interface RightPanelProps {
  gene: GeneType;
  phenotype: PhenotypeType;
  drug: string;
  riskLevel: RiskLevel;
  guidelineStatus: GuidelineStatus;
  evidenceLevel: string;
  suggestedAlternative?: string;
  explanation: string;
  isLoading: boolean;
  source?: string;
  onSaveReport: () => Promise<void>;
  isSaving: boolean;
  isSaved: boolean;
}

export default function RightPanel({
  gene,
  phenotype,
  drug,
  riskLevel,
  guidelineStatus,
  evidenceLevel,
  suggestedAlternative,
  explanation,
  isLoading,
  source,
  onSaveReport,
  isSaving,
  isSaved
}: RightPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const altText = riskLevel !== 'Low Risk' 
        ? `\nSuggested Clinical Alternative:\n${suggestedAlternative || 'Insufficient clinical evidence to suggest an alternative.'}`
        : '';

      await navigator.clipboard.writeText(
        `PharmaGenie Clinical Report\n` +
        `=========================\n` +
        `Gene: ${gene}\n` +
        `Phenotype: ${phenotype}\n` +
        `Drug: ${drug}\n` +
        `Guideline Status: ${guidelineStatus}\n` +
        `Risk Level: ${riskLevel}\n` +
        `Evidence Level: ${evidenceLevel}\n` +
        `Source: ${source || 'Clinical Reference'}\n` +
        altText + `\n\n` +
        `Interpretation:\n${explanation}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // A4 dimensions: 210 x 297 mm
    // Margin: 20 mm
    const margin = 20;
    let y = 25;

    // Header Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('PharmaGenie', margin, y);
    
    // Right-aligned Date
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    const dateStr = `Date: ${new Date().toLocaleDateString()}`;
    doc.text(dateStr, 210 - margin - doc.getTextWidth(dateStr), y - 2);

    y += 6;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text('CLINICAL PHARMACOGENOMICS REFERENCE REPORT', margin, y);

    // Line Separator
    y += 5;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.line(margin, y, 210 - margin, y);

    // Patient Profile section
    y += 12;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('Patient & Variant Profile', margin, y);

    y += 8;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('Target Gene:', margin, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(gene, margin + 45, y);

    y += 7;
    doc.setFont('Helvetica', 'bold');
    doc.text('Patient Phenotype:', margin, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(phenotype, margin + 45, y);

    y += 7;
    doc.setFont('Helvetica', 'bold');
    doc.text('Target Drug:', margin, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(drug, margin + 45, y);

    // Results & Guidance Status section
    y += 12;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Clinical Indicators', margin, y);

    y += 8;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Guideline Status:', margin, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(guidelineStatus, margin + 45, y);

    y += 7;
    doc.setFont('Helvetica', 'bold');
    doc.text('Risk Level:', margin, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(riskLevel, margin + 45, y);

    y += 7;
    doc.setFont('Helvetica', 'bold');
    doc.text('Evidence Level:', margin, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(evidenceLevel, margin + 45, y);

    // Line separator
    y += 8;
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(margin, y, 210 - margin, y);

    // Interpretation Text section
    y += 12;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('Clinical Interpretation', margin, y);

    y += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(51, 65, 85); // slate-700
    
    // Wrap text
    const splitExplanation = doc.splitTextToSize(explanation, 210 - (margin * 2));
    doc.text(splitExplanation, margin, y);
    y += (splitExplanation.length * 6);

    // Suggested Alternative section
    if (riskLevel !== 'Low Risk') {
      y += 10;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Suggested Clinical Alternative', margin, y);

      y += 7;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const altText = suggestedAlternative || 'Insufficient clinical evidence to suggest a pharmacogenomic alternative at this time.';
      const splitAlt = doc.splitTextToSize(altText, 210 - (margin * 2));
      doc.text(splitAlt, margin, y);
      y += (splitAlt.length * 6);
    }

    // Footer Disclaimer
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 265, 210 - margin, 265);

    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    const disclaimerText1 = "This report is for clinical reference only and is not a substitute for professional medical advice.";
    const disclaimerText2 = "Please confirm with a doctor or pharmacist before changing any medication.";
    doc.text(disclaimerText1, margin, 272);
    doc.text(disclaimerText2, margin, 276);

    // System Details footer
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    const sysText = `Report generated by PharmaGenie clinical support tool (CPIC v3.2 reference mapping)`;
    doc.text(sysText, 210 - margin - doc.getTextWidth(sysText), 276);

    doc.save(`PharmaGenie_Report_${gene}_${drug.replace(/\s+/g, '_')}.pdf`);
  };

  // Badge styles
  const getRiskBadgeStyles = (level: RiskLevel) => {
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

  const getGuidelineBadgeStyles = (status: GuidelineStatus) => {
    if (status === 'CPIC/PharmGKB Guideline Exists') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const getEvidenceBadgeStyles = (level: string) => {
    if (level.includes('Level A')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (level.includes('Level B')) {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl flex flex-col shadow-xs h-full" id="result-analysis-panel">
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center" id="loading-state">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Analyzing Variant Pharmacology</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Querying clinical guidelines database and processing via Gemini AI for tailored therapeutic recommendations...
          </p>
        </div>
      ) : explanation ? (
        <div className="p-6 flex flex-col h-full justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-sm border border-slate-200 tracking-wider">
                    RESULT ANALYSIS
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: PG-{gene}-{drug.toUpperCase().substring(0,3)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 flex flex-wrap items-center gap-2">
                  <span>{gene}</span>
                  <span className="text-slate-300 font-light">|</span>
                  <span className="text-slate-600 text-base font-semibold">{phenotype}</span>
                  <span className="text-slate-300 font-light">|</span>
                  <span className="text-teal-700">{drug}</span>
                </h2>
              </div>
              
              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getGuidelineBadgeStyles(guidelineStatus)}`}>
                  {guidelineStatus}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getRiskBadgeStyles(riskLevel)}`}>
                  Risk Level: {riskLevel}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getEvidenceBadgeStyles(evidenceLevel)}`}>
                  {evidenceLevel}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-5 border border-slate-200/60 shadow-2xs max-h-[350px] overflow-y-auto">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pb-1 border-b border-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                Clinical Interpretation & Metabolism
              </h3>
              
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium mb-4">
                {explanation}
              </div>

              {/* 2. Suggested Alternative section */}
              {riskLevel !== 'Low Risk' && (
                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-lg mt-3">
                  <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                    Suggested Clinical Alternative
                  </h4>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                    {suggestedAlternative || 'Insufficient clinical evidence to suggest a pharmacogenomic alternative at this time.'}
                  </p>
                </div>
              )}

              {source && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>System: {source}</span>
                  <span>Database: CPIC® & PharmGKB® Mapping</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {/* Standard Warning / Disclaimer Box */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 font-medium leading-relaxed">
                <strong>Disclaimer:</strong> This is an educational clinical-decision support reference tool. It is not a diagnosis tool. Always confirm with a healthcare provider or pharmacist before changing any prescribed medication or treatment.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>Reference: Sourced from CPIC® V3.2 Guidelines</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* 1. Save Report Button */}
                <button
                  onClick={onSaveReport}
                  disabled={isSaving}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  id="save-history-button"
                >
                  {isSaved ? (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Saved to Cloud</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isSaving ? 'Saving...' : 'Save Report'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopy}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  id="copy-result-button"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleDownloadPDF}
                  className="px-3 py-2 text-xs font-bold text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  id="download-result-button"
                >
                  <Download className="w-3.5 h-3.5 text-teal-400" />
                  <span>Download PDF</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  id="print-result-button"
                >
                  <Printer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Print Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400" id="empty-state">
          <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Info className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">Ready for Assessment</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Select a target gene, input patient phenotypic profile, specify the medication, and trigger clinical generation.
          </p>
        </div>
      )}
    </div>
  );
}
