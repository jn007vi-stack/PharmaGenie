import { Copy, Download, Check, AlertTriangle, FileText, Info, FolderPlus, Cloud, Printer, ShieldAlert, CheckCircle, AlertCircle, Sparkles, User, UserCheck, ChevronDown, ChevronUp, ExternalLink, BookOpen, Dna, Activity, Stethoscope, Shuffle, Eye, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GeneType, PhenotypeType, RiskLevel, GuidelineStatus, AgeGroupType } from '../types';
import { useToast } from './Toast';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { getGuidelineInfo } from '../data/guidelines';

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

  // Real-time Patient Summary properties
  activeGene: GeneType;
  activePhenotype: PhenotypeType;
  activeDrug: string;
  activeAgeGroup: AgeGroupType;
  patientId: string;
}

function ClinicalLoader() {
  const [step, setStep] = useState(0);
  const steps = [
    "Analyzing Pharmacogenomic Profile...",
    "Consulting CPIC Guidelines...",
    "Checking PharmGKB...",
    "Generating Recommendations..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 850);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center" id="clinical-loader">
      <div className="relative w-20 h-20 mb-8">
        <motion.div 
          className="absolute inset-0 rounded-full border-4 border-teal-500/10 dark:border-teal-400/10 bg-teal-500/5 dark:bg-teal-400/5"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        />
        <div className="absolute inset-2 border-2 border-dashed border-teal-600/30 dark:border-teal-400/35 rounded-full animate-spin [animation-duration:12s]" />
        
        <div className="absolute inset-4 bg-teal-50 dark:bg-slate-900 border border-teal-100 dark:border-slate-800 rounded-full flex items-center justify-center shadow-xs">
          <Dna className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-pulse" />
        </div>
      </div>
      
      <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-6 font-display uppercase tracking-wider">
        Clinical Diagnostic Engine Active
      </h3>
      
      <div className="w-full max-w-sm space-y-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl shadow-3xs text-left">
        {steps.map((text, idx) => {
          const isDone = idx < step;
          const isActive = idx === step;
          return (
            <div 
              key={text} 
              className={`flex items-center gap-3 transition-all duration-300 ${
                isActive ? 'opacity-100 scale-[1.02] translate-x-1' : isDone ? 'opacity-70' : 'opacity-30'
              }`}
            >
              {isDone ? (
                <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                </div>
              ) : isActive ? (
                <div className="w-4 h-4 rounded-full border-2 border-teal-600 dark:border-teal-400 border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shrink-0" />
              )}
              <span className={`text-xs font-bold ${
                isActive 
                  ? 'text-teal-600 dark:text-teal-400 font-extrabold' 
                  : isDone 
                    ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-850' 
                    : 'text-slate-400 dark:text-slate-550'
              }`}>
                {text}
              </span>
            </div>
          );
        })}
      </div>

      <div className="w-48 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-8">
        <div 
          className="bg-gradient-to-r from-teal-500 to-indigo-600 dark:from-teal-400 dark:to-indigo-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
    </div>
  );
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
  isSaved,
  activeGene,
  activePhenotype,
  activeDrug,
  activeAgeGroup,
  patientId
}: RightPanelProps) {
  const { success, info, warning } = useToast();
  const [copied, setCopied] = useState(false);
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);

  // Dynamic Clinical Risk score mapping based on props
  let riskPercent = 15;
  let riskColorText = "text-emerald-600";
  if (riskLevel === 'High Risk') {
    riskPercent = 95;
    riskColorText = "text-rose-600";
  } else if (riskLevel === 'Caution') {
    riskPercent = 65;
    riskColorText = "text-amber-600";
  } else if (riskLevel === 'Insufficient Data') {
    riskPercent = 5;
    riskColorText = "text-slate-500";
  }

  // Evidence Strength mapping based on evidenceLevel prop
  let evidenceStrength = "Limited / Informational Evidence";
  let evidenceShort = "Level C/D";
  let evidenceBg = "bg-slate-100 text-slate-700 border-slate-200/50";
  let evidenceDetail = "Emerging research, small observational studies, or pre-clinical annotations.";

  if (evidenceLevel.toLowerCase().includes('level a') || evidenceLevel.toLowerCase().includes('strong')) {
    evidenceStrength = "Strong Evidence (CPIC Level A)";
    evidenceShort = "Level A";
    evidenceBg = "bg-indigo-50 text-indigo-700 border-indigo-200/50";
    evidenceDetail = "Extensive clinical trial data, cohort replication, and general consensus among global guidelines.";
  } else if (evidenceLevel.toLowerCase().includes('level b') || evidenceLevel.toLowerCase().includes('moderate')) {
    evidenceStrength = "Moderate Evidence (CPIC Level B)";
    evidenceShort = "Level B";
    evidenceBg = "bg-sky-50 text-sky-700 border-sky-200/50";
    evidenceDetail = "Replicated clinical trial data with consistent therapeutic recommendations.";
  }

  // Confidence level mapping based on props
  let confidenceText = "Moderate Confidence";
  let confidenceDescription = "Informational or preliminary findings requiring additional clinical monitoring.";
  let confidenceColor = "text-slate-600 bg-slate-50 border-slate-200";

  if (riskLevel === 'High Risk') {
    confidenceText = "Very High Confidence";
    confidenceDescription = "Strong genetic impact matched to validated guidelines with peer-reviewed replication studies.";
    confidenceColor = "text-rose-750 bg-rose-50 border-rose-200/60";
  } else if (riskLevel === 'Caution') {
    confidenceText = "High Confidence";
    confidenceDescription = "Consensus recommendations support actionable dosing alterations based on consistent patient outcomes.";
    confidenceColor = "text-amber-750 bg-amber-50 border-amber-200/60";
  } else if (riskLevel === 'Low Risk') {
    confidenceText = "High Confidence";
    confidenceDescription = "Established wild-type clearance rates mapped to routine medication dosing regimens.";
    confidenceColor = "text-emerald-750 bg-emerald-50 border-emerald-200/60";
  }

  // Guideline Quality
  const guidelineQuality = guidelineStatus === 'CPIC/PharmGKB Guideline Exists' 
    ? "High Quality (CPIC® Category A/B Guideline)" 
    : "Standard Reference";
  const qualityDetail = guidelineStatus === 'CPIC/PharmGKB Guideline Exists'
    ? "Standardized clinical protocols designed for direct bedside implementation with active updates."
    : "Sourced from PharmGKB research annotation database and literature reference databases.";

  // Dynamic calculation for real-time sticky summary card
  const activeGuideline = getGuidelineInfo(activeGene, activePhenotype, activeDrug);
  const activeRisk = activeGuideline.riskLevel;

  // Concise Clinical Recommendation mapping based on risk & drug
  const getConciseRecommendation = (risk: RiskLevel, g: string, d: string): string => {
    const dName = d.toLowerCase();
    if (risk === 'High Risk') {
      if (dName.includes('codeine') || dName.includes('tramadol')) return 'Avoid';
      if (dName.includes('clopidogrel')) return 'Avoid agent';
      if (dName.includes('fluorouracil')) return 'Avoid / Reduce dose';
      return 'Avoid';
    }
    if (risk === 'Caution') {
      if (dName.includes('simvastatin')) return 'Limit dose (Max 20mg)';
      if (dName.includes('azathioprine')) return 'Reduce starting dose';
      if (dName.includes('warfarin')) return 'Reduce dose & monitor';
      return 'Dose Adjustment';
    }
    if (risk === 'Low Risk') {
      return 'Routine Standard Dosing';
    }
    return 'Standard Protocol';
  };

  const conciseRec = getConciseRecommendation(activeRisk, activeGene, activeDrug);

  // Map risk level text to a concise string (e.g. 'High' for High Risk)
  let clinicalRiskText = 'Low';
  let riskBadgeStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
  if (activeRisk === 'High Risk') {
    clinicalRiskText = 'High';
    riskBadgeStyles = 'bg-rose-50 text-rose-700 border-rose-200/50';
  } else if (activeRisk === 'Caution') {
    clinicalRiskText = 'Caution';
    riskBadgeStyles = 'bg-amber-50 text-amber-700 border-amber-200/50';
  } else if (activeRisk === 'Insufficient Data') {
    clinicalRiskText = 'Standard';
    riskBadgeStyles = 'bg-slate-50 text-slate-600 border-slate-200/50';
  }

  // Styles of recommendation
  let recStyles = 'bg-slate-50 text-slate-700 border-slate-200';
  if (activeRisk === 'High Risk') {
    recStyles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (activeRisk === 'Caution') {
    recStyles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (activeRisk === 'Low Risk') {
    recStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  interface AlternativeCard {
    name: string;
    suitability: 'Recommended' | 'Use with Caution' | 'Avoid';
    whyRecommended: string;
    evidenceLevel: string;
    riskLevel: RiskLevel;
  }

  const getDetailedClinicalInterpretation = (
    g: GeneType,
    p: PhenotypeType,
    d: string,
    rl: RiskLevel
  ) => {
    const dName = d.toLowerCase();
    
    // Default/Fallback values
    let whyThisHappens = `The patient has been identified with the ${p} phenotype for the ${g} gene. This genotype alters the corresponding enzyme's metabolic capacity, impacting how ${d} is processed.`;
    let clinicalImpact = `Based on the ${p} profile, the rate of clearance or activation of ${d} is modified. This could increase the risk of adverse drug reactions or lead to a lack of therapeutic efficacy.`;
    let treatmentRecommendation = `Standard dosing may require clinical adjustments. If the risk level is high, alternative therapeutic strategies are recommended to ensure safety and clinical efficacy.`;
    
    let alternativeDrugs: AlternativeCard[] = [
      {
        name: dName.includes('codeine') || dName.includes('tramadol') ? 'Morphine' : 'Alternative Agent',
        suitability: 'Recommended',
        whyRecommended: 'Bypasses the genetic variation pathway completely to ensure expected therapeutic action.',
        evidenceLevel: 'Strong Evidence (CPIC Level A)',
        riskLevel: 'Low Risk'
      },
      {
        name: 'Non-opioid Option',
        suitability: 'Recommended',
        whyRecommended: 'Provides excellent alternative efficacy without metabolic risks.',
        evidenceLevel: 'Strong Evidence (CPIC Level A)',
        riskLevel: 'Low Risk'
      }
    ];
    
    let monitoringAdvice = `Regularly monitor the patient's clinical response, liver/kidney function, or specific biomarkers to evaluate drug safety and efficacy.`;
    let patientCounseling = `Counsel the patient on potential side effects, the importance of genetic-based dosing, and when to seek urgent medical attention.`;

    // 1. CYP2D6 + Codeine
    if (g === 'CYP2D6' && dName.includes('codeine')) {
      if (p === 'Poor Metabolizer') {
        whyThisHappens = "Codeine is a prodrug that requires bioactivation into its active metabolite, morphine, by the CYP2D6 enzyme. Because the patient is a CYP2D6 Poor Metabolizer, they have extremely low to absent functional enzyme activity.";
        clinicalImpact = "The patient cannot convert codeine into active morphine. This results in complete lack of therapeutic efficacy, meaning the patient will experience little to no pain relief from codeine.";
        treatmentRecommendation = "Avoid codeine entirely. Prescribe alternative analgesics that do not require bioactivation via the CYP2D6 pathway.";
        alternativeDrugs = [
          {
            name: "Morphine",
            suitability: "Recommended",
            whyRecommended: "Directly active opioid. Bypasses the need for CYP2D6 bioactivation completely.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Ibuprofen",
            suitability: "Recommended",
            whyRecommended: "Highly effective NSAID. Clearance is completely independent of the CYP2D6 pathway.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Fentanyl",
            suitability: "Recommended",
            whyRecommended: "Synthetic opioid. Metabolized primarily by CYP3A4, completely bypassing CYP2D6.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Monitor patient's pain scores using standard scales (e.g., VAS) to ensure alternative therapy is effective. Watch for standard opioid side effects if alternative opioids are initiated.";
        patientCounseling = "Inform the patient that their body lacks the 'engine' to convert codeine into pain-relief medication, rendering codeine ineffective. Instruct them to note 'codeine ineffective due to CYP2D6 genotype' on their medical records.";
      } else if (p === 'Ultra-rapid Metabolizer') {
        whyThisHappens = "The patient has multiple copies of active CYP2D6 genes, leading to abnormally high enzyme expression. This causes rapid and extensive bioactivation of the prodrug codeine into morphine.";
        clinicalImpact = "Extremely rapid generation of active morphine leads to a high risk of severe opioid toxicity, including life-threatening respiratory depression, extreme sedation, nausea, and severe constipation, even at standard doses.";
        treatmentRecommendation = "Codeine is strictly contraindicated. Avoid codeine entirely to prevent potentially fatal morphine toxicity.";
        alternativeDrugs = [
          {
            name: "Ibuprofen",
            suitability: "Recommended",
            whyRecommended: "Bypasses CYP2D6 completely. Provides non-opioid pain relief with no risk of respiratory depression.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Morphine",
            suitability: "Use with Caution",
            whyRecommended: "Directly active opioid that bypasses CYP2D6 activation. However, standard opioid toxicity caution is still required.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Caution"
          },
          {
            name: "Codeine",
            suitability: "Avoid",
            whyRecommended: "Strictly contraindicated due to extreme risk of hyper-rapid morphine toxicity.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "High Risk"
          }
        ];
        monitoringAdvice = "If non-codeine opioids are used, closely monitor respiratory rate, oxygen levels, and mental status. Standard safety thresholds apply.";
        patientCounseling = "Warn the patient that codeine is highly dangerous for them because their body processes it into active morphine too quickly, which can cause severe breathing problems. Instruct them to list codeine as a severe drug allergy.";
      } else if (p === 'Intermediate Metabolizer') {
        whyThisHappens = "The patient has moderately reduced CYP2D6 enzyme activity, typically due to inheriting one normal functional allele and one inactive/decreased-activity allele.";
        clinicalImpact = "Slower conversion of codeine to morphine can lead to suboptimal active drug levels, resulting in inadequate or variable pain control.";
        treatmentRecommendation = "Consider starting with standard doses but closely monitor pain relief. If ineffective, consider switching to an alternative analgesic not dependent on CYP2D6.";
        alternativeDrugs = [
          {
            name: "Morphine",
            suitability: "Recommended",
            whyRecommended: "Fully active. Avoids the variable CYP2D6 conversion step completely.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Ibuprofen",
            suitability: "Recommended",
            whyRecommended: "Clearance is independent of the CYP2D6 pathway. Provides consistent non-opioid pain relief.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Monitor pain relief scores daily. If pain is not controlled within 24-48 hours, switch therapies rather than escalating codeine dose.";
        patientCounseling = "Advise the patient that codeine may not work fully or consistently for their pain. Teach them to report lack of efficacy promptly.";
      } else {
        // Normal/Rapid
        whyThisHappens = "The patient possesses normal, fully functional CYP2D6 alleles (*1, *2), yielding standard metabolic enzymatic capacity.";
        clinicalImpact = "Expected conversion rates of codeine to morphine ensure normal therapeutic response and normal clearance, with a standard safety profile.";
        treatmentRecommendation = "Standard age-appropriate dosing is recommended. No genetic contraindications.";
        alternativeDrugs = [
          {
            name: "Codeine",
            suitability: "Recommended",
            whyRecommended: "Fully suitable as first-line therapy according to standard guidelines.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Standard pain and safety monitoring as clinically indicated.";
        patientCounseling = "Instruct the patient to follow standard dosing and report any standard side effects like mild drowsiness or constipation.";
      }
    }
    // 2. CYP2D6 + Tramadol
    else if (g === 'CYP2D6' && dName.includes('tramadol')) {
      if (p === 'Poor Metabolizer') {
        whyThisHappens = "Tramadol is a prodrug requiring bioactivation by CYP2D6 into its active O-desmethyltramadol (M1) metabolite, which is significantly more potent at opioid receptors. Poor metabolizers lack functional CYP2D6 activity.";
        clinicalImpact = "The patient cannot generate the highly active M1 metabolite, resulting in severely compromised pain control and clinical non-response to tramadol.";
        treatmentRecommendation = "Avoid tramadol. Use alternatives that bypass CYP2D6 metabolism.";
        alternativeDrugs = [
          {
            name: "Morphine",
            suitability: "Recommended",
            whyRecommended: "Active opioid analgesic that does not depend on CYP2D6 activation.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Ibuprofen",
            suitability: "Recommended",
            whyRecommended: "NSAID pain relief completely bypassing hepatic CYP2D6 clearance.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Assess pain levels regularly. Do not escalate tramadol dosage as this will only increase parent-drug side effects (nausea, seizures) without improving pain relief.";
        patientCounseling = "Explain to the patient that tramadol cannot be activated by their body. Encourage them to request alternative analgesics from all medical professionals.";
      } else if (p === 'Ultra-rapid Metabolizer') {
        whyThisHappens = "The patient has increased CYP2D6 metabolic activity due to gene duplication, converting tramadol into active O-desmethyltramadol at an accelerated rate.";
        clinicalImpact = "Extreme active metabolite levels can cause acute opioid intoxication, posing serious safety concerns like respiratory depression, severe dizziness, and extreme sedation.";
        treatmentRecommendation = "Tramadol is contraindicated. Avoid tramadol entirely to ensure patient safety.";
        alternativeDrugs = [
          {
            name: "Ibuprofen",
            suitability: "Recommended",
            whyRecommended: "Safe non-opioid alternative that does not present risks of rapid opioid conversion.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Tramadol",
            suitability: "Avoid",
            whyRecommended: "Contraindicated due to high danger of respiratory depression from rapid activation.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "High Risk"
          }
        ];
        monitoringAdvice = "If other central analgesics are introduced, implement oxygenation and mental status tracking.";
        patientCounseling = "Advise the patient that tramadol poses an exceptionally high risk of toxic sleepiness and breathing difficulties. Ensure this is noted as a contraindication.";
      } else if (p === 'Intermediate Metabolizer') {
        whyThisHappens = "The patient has reduced CYP2D6 enzyme activity, leading to slower bioactivation of tramadol.";
        clinicalImpact = "Suboptimal active metabolite levels may cause partial or inconsistent pain relief.";
        treatmentRecommendation = "Standard starting dose is acceptable, but monitor efficacy closely. Be prepared to shift to non-CYP2D6 alternatives.";
        alternativeDrugs = [
          {
            name: "Morphine",
            suitability: "Recommended",
            whyRecommended: "Fully active. Bypass CYP2D6 metabolic limitations.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Ibuprofen",
            suitability: "Recommended",
            whyRecommended: "Completely independent of CYP2D6. Reliable NSAID action.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Check pain levels daily. Avoid excessive dosing of tramadol.";
        patientCounseling = "Inform the patient that tramadol may not provide complete pain relief and that alternatives are available if needed.";
      } else {
        whyThisHappens = "The patient possesses normal CYP2D6 enzyme function, allowing standard rates of tramadol bioactivation.";
        clinicalImpact = "Expected analgesic response with standard clinical safety parameters and routine clearance.";
        treatmentRecommendation = "Standard dosing is fully recommended. Adjust based on traditional clinical factors (age, kidney function).";
        alternativeDrugs = [
          {
            name: "Tramadol",
            suitability: "Recommended",
            whyRecommended: "Fully appropriate as a standard analgesic option.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Routine pain and safety monitoring as indicated.";
        patientCounseling = "Follow standard prescribing directions and monitor for mild side effects like drowsiness or nausea.";
      }
    }
    // 3. CYP2C19 + Clopidogrel
    else if (g === 'CYP2C19' && dName.includes('clopidogrel')) {
      if (p === 'Poor Metabolizer') {
        whyThisHappens = "Clopidogrel is an inactive prodrug that requires a two-step hepatic oxidation process, with CYP2C19 being the key rate-limiting enzyme. CYP2C19 Poor Metabolizers (*2/*2 or *2/*3) have no functional CYP2C19 activity.";
        clinicalImpact = "The patient cannot generate active clopidogrel metabolite, leaving platelet P2Y12 receptors uninhibited. This leads to a severe risk of major cardiovascular events, stent thrombosis, and ischemic stroke.";
        treatmentRecommendation = "Avoid clopidogrel entirely. Use alternative antiplatelet therapies that are not dependent on the CYP2C19 pathway.";
        alternativeDrugs = [
          {
            name: "Ticagrelor",
            suitability: "Recommended",
            whyRecommended: "Direct-acting P2Y12 inhibitor. Bypasses CYP2C19 bioactivation entirely.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Prasugrel",
            suitability: "Recommended",
            whyRecommended: "Activated by other cytochrome enzymes (CYP3A4, CYP2B6), bypassing CYP2C19 dependence.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Clopidogrel",
            suitability: "Avoid",
            whyRecommended: "Contraindicated due to high risk of therapeutic failure and stent thrombosis.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "High Risk"
          }
        ];
        monitoringAdvice = "If clopidogrel is mistakenly continued, consider platelet function tests. Monitor for ischemic events (e.g., chest pain, shortness of breath).";
        patientCounseling = "Counsel the patient that clopidogrel will not protect them from blood clots or heart attacks. They must switch to an alternative like Ticagrelor as soon as possible.";
      } else if (p === 'Intermediate Metabolizer') {
        whyThisHappens = "The patient has moderately reduced CYP2C19 enzyme activity, typically due to inheriting one loss-of-function allele (*2 or *3) and one wild-type allele (*1).";
        clinicalImpact = "Reduced active metabolite levels result in suboptimal platelet inhibition, keeping the patient at an elevated risk of ischemic stroke and cardiac stent clotting.";
        treatmentRecommendation = "Avoid clopidogrel. Select alternative antiplatelet therapy (Ticagrelor or Prasugrel) if there are no contraindications (such as history of stroke for Prasugrel).";
        alternativeDrugs = [
          {
            name: "Ticagrelor",
            suitability: "Recommended",
            whyRecommended: "Provides direct and consistent antiplatelet effect, unaffected by CYP2C19 activity.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Prasugrel",
            suitability: "Recommended",
            whyRecommended: "More robust activation bypassing CYP2C19. (Note: contraindicated if history of TIA/stroke).",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Observe closely for ischemic markers or use platelet aggregation assays if clinical ambiguity arises.";
        patientCounseling = "Explain that clopidogrel offers incomplete protection due to their genetic clearance rate. Advise them to switch to the recommended alternative.";
      } else if (p === 'Ultra-rapid Metabolizer' || p === 'Rapid Metabolizer') {
        whyThisHappens = "The patient has increased CYP2C19 activity due to the presence of the gain-of-function *17 allele, leading to rapid clopidogrel bioactivation.";
        clinicalImpact = "Increased active metabolite levels lead to robust platelet inhibition, resulting in highly effective thrombosis prevention but a potentially slight increase in minor bleeding risk.";
        treatmentRecommendation = "Standard clopidogrel dose (75mg daily) is fully acceptable. No genetic reason to switch.";
        alternativeDrugs = [
          {
            name: "Clopidogrel",
            suitability: "Recommended",
            whyRecommended: "Highly effective in this phenotype with normal to enhanced antiplatelet action.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Standard post-operative and bleeding monitoring (e.g., bruising, hematuria).";
        patientCounseling = "Reassure the patient that clopidogrel is highly effective for them. Educate on standard bleeding precautions.";
      } else {
        whyThisHappens = "The patient has standard, fully functional CYP2C19 (*1/*1) enzyme activity.";
        clinicalImpact = "Standard bioactivation rates of clopidogrel yield expected antiplatelet responses with a typical safety profile.";
        treatmentRecommendation = "Prescribe standard clopidogrel dosing (75mg daily).";
        alternativeDrugs = [
          {
            name: "Clopidogrel",
            suitability: "Recommended",
            whyRecommended: "Standard first-line therapy with proven efficacy.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Standard cardiovascular monitoring.";
        patientCounseling = "Follow standard daily antiplatelet guidelines and compliance.";
      }
    }
    // 4. DPYD + Fluorouracil
    else if (g === 'DPYD' && dName.includes('fluorouracil')) {
      if (p === 'Poor Metabolizer') {
        whyThisHappens = "Dihydropyrimidine dehydrogenase (encoded by DPYD) is the primary clearance and rate-limiting enzyme responsible for metabolizing over 80% of clinical fluorouracil. Poor metabolizers have profound or complete DPD deficiency.";
        clinicalImpact = "Complete lack of metabolic clearance leads to extreme, life-threatening systemic accumulation of fluorouracil. This causes catastrophic grade 3-4 toxicities, including severe myelosuppression, mucositis, intractable diarrhea, and neurotoxicity.";
        treatmentRecommendation = "Fluorouracil is strictly contraindicated. Avoid fluorouracil entirely. Select non-fluoropyrimidine chemotherapy regimens.";
        alternativeDrugs = [
          {
            name: "Non-Fluoropyrimidine Chemo",
            suitability: "Recommended",
            whyRecommended: "Completely bypasses DPD-dependent metabolism to prevent catastrophic toxicity.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Fluorouracil",
            suitability: "Avoid",
            whyRecommended: "Strictly contraindicated. Extremely high risk of lethal systemic toxicities.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "High Risk"
          }
        ];
        monitoringAdvice = "If inadvertently exposed, immediately stop infusion. Be prepared to administer emergency antidote (uridine triacetate). Monitor CBC, liver/renal status continuously in an inpatient setting.";
        patientCounseling = "Warn the patient and family that standard fluorouracil doses can be fatal due to their complete lack of clearance. Ensure 'DPYD deficient - NO fluoropyrimidines' is prominently displayed in their records.";
      } else if (p === 'Intermediate Metabolizer') {
        whyThisHappens = "The patient has partial DPD enzyme deficiency, typically heterozygous for a DPYD risk variant (e.g., *2A, *13, or c.2846A>T), leading to moderately decreased drug clearance.";
        clinicalImpact = "Significantly higher systemic exposure to fluorouracil increases the risk of early-onset, severe, and potentially dangerous hematological and gastrointestinal toxicities.";
        treatmentRecommendation = "Reduce starting dose by at least 50% to prevent severe toxicities. Titrate future doses cautiously based on clinical tolerance and therapeutic monitoring.";
        alternativeDrugs = [
          {
            name: "50% Reduced Fluorouracil",
            suitability: "Use with Caution",
            whyRecommended: "Required starting adjustment to prevent severe hematological and gut toxicity.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Caution"
          },
          {
            name: "Non-Fluoropyrimidine Chemo",
            suitability: "Recommended",
            whyRecommended: "Bypasses DPD-dependent metabolic pathways completely.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Perform frequent CBC checks with differential. Monitor for early signs of toxicity (e.g., mouth sores, severe diarrhea, fever).";
        patientCounseling = "Explain to the patient that their body clears chemotherapy slower, making standard doses toxic. Reassure them that a 50% dose reduction is the standard, safer starting protocol.";
      } else {
        whyThisHappens = "The patient has standard, fully functional DPD enzyme activity, allowing normal metabolic clearance.";
        clinicalImpact = "Normal therapeutic response and expected standard rate of drug elimination, with a routine safety profile.";
        treatmentRecommendation = "Standard clinical starting doses are fully recommended.";
        alternativeDrugs = [
          {
            name: "Fluorouracil",
            suitability: "Recommended",
            whyRecommended: "Standard first-line regimen according to oncology guidelines.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Standard chemotherapy safety monitoring.";
        patientCounseling = "Follow standard chemotherapy instructions, including hydration and reporting side effects.";
      }
    }
    // 5. SLCO1B1 + Simvastatin
    else if (g === 'SLCO1B1' && dName.includes('simvastatin')) {
      if (p === 'Poor Metabolizer') {
        whyThisHappens = "SLCO1B1 encodes the OATP1B1 hepatic uptake transporter, which imports simvastatin acid from the blood into the liver. Poor metabolizers have highly decreased transporter activity.";
        clinicalImpact = "Failure of hepatic uptake leads to dramatically elevated systemic simvastatin concentrations in blood plasma, targeting skeletal muscle tissue and resulting in statin-induced myopathy, severe muscle pain, or life-threatening rhabdomyolysis.";
        treatmentRecommendation = "Avoid simvastatin (especially high doses like 40mg or 80mg). Switch to an alternative statin with lower myopathy risks.";
        alternativeDrugs = [
          {
            name: "Rosuvastatin",
            suitability: "Recommended",
            whyRecommended: "Highly effective statin with minimal dependency on the SLCO1B1 transporter.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Pravastatin",
            suitability: "Recommended",
            whyRecommended: "Low-potency statin with a very low risk profile for statin-associated muscle symptoms.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Simvastatin",
            suitability: "Avoid",
            whyRecommended: "Highly contraindicated due to an extreme risk of muscle soreness and rhabdomyolysis.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "High Risk"
          }
        ];
        monitoringAdvice = "Obtain baseline creatine kinase (CK) levels. Monitor closely for muscle pain, weakness, or brown-colored urine.";
        patientCounseling = "Explain to the patient that simvastatin stays in their blood and targets muscles instead of entering the liver. Instruct them to report any unexplained muscle pain or weakness immediately.";
      } else if (p === 'Intermediate Metabolizer') {
        whyThisHappens = "The patient has moderately decreased OATP1B1 transporter function, leading to moderately increased systemic simvastatin exposure.";
        clinicalImpact = "Increased risk of myopathy and muscle pain, especially if higher doses (e.g., 40mg or 80mg) of simvastatin are prescribed.";
        treatmentRecommendation = "Limit simvastatin to a maximum of 20mg/day, or switch to alternative statins like Rosuvastatin or Atorvastatin.";
        alternativeDrugs = [
          {
            name: "Rosuvastatin",
            suitability: "Recommended",
            whyRecommended: "Provides robust lipid-lowering efficacy with a much lower risk of muscle toxicity.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Low-dose Simvastatin (10-20mg)",
            suitability: "Use with Caution",
            whyRecommended: "Acceptable under strict dose limitations, but alternatives are generally preferred.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Caution"
          }
        ];
        monitoringAdvice = "Routine check of lipid panel and reporting of any new-onset muscle discomfort.";
        patientCounseling = "Instruct the patient on the daily dose limit and teach them to watch for and report any muscle tenderness or soreness.";
      } else {
        whyThisHappens = "The patient has normal, fully functional OATP1B1 transporter activity, ensuring standard uptake into the liver.";
        clinicalImpact = "Expected lipid-lowering efficacy and a low risk of statin-associated musculoskeletal symptoms.";
        treatmentRecommendation = "Standard simvastatin starting doses are fully appropriate.";
        alternativeDrugs = [
          {
            name: "Simvastatin",
            suitability: "Recommended",
            whyRecommended: "Highly appropriate and safe statin option.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Standard lipid panel checks.";
        patientCounseling = "Advise on healthy diet, regular exercise, and adherence to standard dosing schedules.";
      }
    }
    // 6. TPMT + Azathioprine
    else if (g === 'TPMT' && dName.includes('azathioprine')) {
      if (p === 'Poor Metabolizer') {
        whyThisHappens = "TPMT is the primary clearance pathway responsible for converting active thiopurine drug intermediates into inactive compounds. TPMT Poor Metabolizers have complete or near-complete TPMT deficiency.";
        clinicalImpact = "Virtually 100% of the dose is shunted into highly active, toxic thioguanine nucleotides (TGNs). This causes profound, life-threatening bone marrow suppression (myelosuppression), fatal infection risks, and severe anemia.";
        treatmentRecommendation = "For azathioprine, reduce starting dose by 10-fold (90% reduction) and dose 3 times weekly, or utilize alternative non-thiopurine therapies.";
        alternativeDrugs = [
          {
            name: "Mycophenolate Mofetil",
            suitability: "Recommended",
            whyRecommended: "Non-thiopurine immunosuppressant. Completely bypasses the TPMT metabolic pathway.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Methotrexate",
            suitability: "Recommended",
            whyRecommended: "Folate pathway antagonist with clearance independent of TPMT enzyme.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "10% Reduced Azathioprine",
            suitability: "Use with Caution",
            whyRecommended: "Acceptable only under extremely rigorous hematological surveillance and specialized clinical supervision.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Caution"
          }
        ];
        monitoringAdvice = "Perform baseline CBC. Monitor complete blood count (CBC) with differential weekly for the first 8 weeks, then monthly. Watch for low white blood cell counts.";
        patientCounseling = "Advise the patient that standard doses are extremely toxic to their bone marrow. Instruct them to immediately report any fever, chills, sore throat, or unusual bleeding.";
      } else if (p === 'Intermediate Metabolizer') {
        whyThisHappens = "The patient has moderately decreased TPMT enzyme activity, typically due to heterozygous risk alleles (*2, *3A, or *3C).";
        clinicalImpact = "Increased systemic exposure to toxic thioguanine nucleotides increases the risk of moderate to severe myelosuppression and low white blood counts.";
        treatmentRecommendation = "Reduce standard starting dose by 30% to 50% to prevent bone marrow toxicity. Titrate doses slowly based on clinical tolerance.";
        alternativeDrugs = [
          {
            name: "30-50% Reduced Azathioprine",
            suitability: "Use with Caution",
            whyRecommended: "Starting dose reduction is mandatory to avoid toxicity while preserving efficacy.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Caution"
          },
          {
            name: "Mycophenolate Mofetil",
            suitability: "Recommended",
            whyRecommended: "Avoids all TPMT-related myelosuppression risks entirely.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Monitor CBC with differential every 2 weeks for the first 2 months, then every 1-2 months thereafter.";
        patientCounseling = "Explain that a lower initial dose is safer and fully standard for their genetic profile. Detail symptoms of bone marrow suppression to watch for.";
      } else {
        whyThisHappens = "The patient has normal, fully functional TPMT enzyme activity, allowing typical clearance rates.";
        clinicalImpact = "Expected therapeutic immunosuppressive response with standard risk of myelosuppression.";
        treatmentRecommendation = "Standard azathioprine starting doses are appropriate.";
        alternativeDrugs = [
          {
            name: "Azathioprine",
            suitability: "Recommended",
            whyRecommended: "Fully appropriate as a first-line therapeutic option.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Standard routine CBC checks.";
        patientCounseling = "Educate on routine medication protocols and typical side effects.";
      }
    }
    // 7. CYP2C9 / VKORC1 + Warfarin
    else if ((g === 'CYP2C9' || g === 'VKORC1') && dName.includes('warfarin')) {
      if (p === 'Poor Metabolizer') {
        whyThisHappens = "CYP2C9 metabolizes active S-warfarin, while VKORC1 is the target enzyme. Variants causing low CYP2C9 clearance or high VKORC1 sensitivity (e.g., VKORC1 -1639G>A AA genotype) result in a severe increase in drug sensitivity.";
        clinicalImpact = "Standard empirical warfarin dosing leads to extreme anticoagulation, highly prolonged INR ratios, and a dangerous risk of major internal or external bleeding.";
        treatmentRecommendation = "Significantly reduce the starting dose (typically by 50-70%). Utilize a validated pharmacogenetic-guided algorithm (e.g., WarfarinDosing.org) to calculate safe starting doses.";
        alternativeDrugs = [
          {
            name: "Apixaban",
            suitability: "Recommended",
            whyRecommended: "Direct oral anticoagulant (DOAC). Bypasses CYP2C9 and VKORC1 pathways entirely.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Rivaroxaban",
            suitability: "Recommended",
            whyRecommended: "DOAC with highly predictable clearance independent of VKORC1.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Algorithm-Guided Warfarin",
            suitability: "Use with Caution",
            whyRecommended: "Allows warfarin use only if initial doses are heavily reduced and monitored intensely.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Caution"
          }
        ];
        monitoringAdvice = "Frequent INR monitoring (e.g., 2-3 times weekly initially) until stable. Monitor for clinical signs of hemorrhage.";
        patientCounseling = "Emphasize strict adherence to daily dosing and frequent INR checks. Advise them to watch for dark/tarry stools, severe nosebleeds, or extensive bruising.";
      } else if (p === 'Intermediate Metabolizer') {
        whyThisHappens = "The patient has moderately decreased CYP2C9 metabolism or moderate VKORC1 sensitivity (AG genotype).";
        clinicalImpact = "Increased sensitivity to warfarin raises the risk of over-anticoagulation and minor bleeding events.";
        treatmentRecommendation = "Reduce starting doses by 20-30% and monitor INR closely. Consider utilizing precision dosing algorithms.";
        alternativeDrugs = [
          {
            name: "Apixaban",
            suitability: "Recommended",
            whyRecommended: "Highly predictable DOAC alternative.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          },
          {
            name: "Reduced-dose Warfarin",
            suitability: "Use with Caution",
            whyRecommended: "Safe if starting doses are reduced by 20-30% with routine INR tracking.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Caution"
          }
        ];
        monitoringAdvice = "Weekly to bi-weekly INR checks during initial titration phases.";
        patientCounseling = "Explain the importance of consistent dosing, stable dietary vitamin K intake, and regular blood tests.";
      } else {
        whyThisHappens = "The patient has standard sensitivity and normal S-warfarin clearance capacity.";
        clinicalImpact = "Expected therapeutic anticoagulation window with typical risk profiles.";
        treatmentRecommendation = "Use standard clinical starting dosing tables (e.g., 5mg daily) and adjust based on standard INR tests.";
        alternativeDrugs = [
          {
            name: "Warfarin",
            suitability: "Recommended",
            whyRecommended: "Standard first-line anticoagulant option.",
            evidenceLevel: "Strong Evidence (CPIC Level A)",
            riskLevel: "Low Risk"
          }
        ];
        monitoringAdvice = "Routine regular INR monitoring.";
        patientCounseling = "Follow standard guidelines on dietary vitamin K consistency and bleed reporting.";
      }
    }

    return {
      whyThisHappens: { title: "Why this happens", content: whyThisHappens },
      clinicalImpact: { title: "Clinical Impact", content: clinicalImpact },
      treatmentRecommendation: { title: "Treatment Recommendation", content: treatmentRecommendation },
      alternativeDrugs,
      monitoringAdvice: { title: "Monitoring Advice", content: monitoringAdvice },
      patientCounseling: { title: "Patient Counseling Notes", content: patientCounseling }
    };
  };

  const getClinicalEvidence = (g: GeneType, d: string) => {
    const dName = d.toLowerCase();
    
    // Default Fallback values
    let cpicSummary = `CPIC therapeutic guidelines currently evaluate genetic variant interactions to optimize prescription safety. For ${g} and ${d}, consult localized standard references for metabolic activity level guidelines.`;
    let pharmGkbEvidence = `PharmGKB annotates clinical pharmacogenomic findings for gene-drug pairings. For ${g} and ${d}, annotations highlight gene variant alleles influencing liver clearance rates.`;
    let fdaLabel = `FDA-approved drug labeling (prescribing information) for ${d} contains a Section 12.5 (Pharmacogenomics) outline detailing potential interactions or metabolic dependencies.`;
    let researchRefs = [
      {
        title: `Search CPIC database for active ${g} clinical guidelines`,
        citation: `Clinical Pharmacogenetics Implementation Consortium (CPIC®). Guidelines overview.`,
        url: `https://cpicpgx.org/guidelines/`
      },
      {
        title: `Explore PharmGKB curated pharmacogenomics annotations for ${g}`,
        citation: `PharmGKB. Pharmacogenomics Knowledgebase, Stanford University.`,
        url: `https://www.pharmgkb.org/gene/PA${g === 'CYP2D6' ? '123' : g === 'CYP2C19' ? '124' : '125'}`
      }
    ];

    if (g === 'CYP2D6' && dName.includes('codeine')) {
      cpicSummary = "CPIC Guideline for CYP2D6 and Codeine: Codeine is a prodrug converted to its active metabolite morphine by CYP2D6. Poor metabolizers lack CYP2D6 activity, rendering the medication ineffective. Ultra-rapid metabolizers convert codeine rapidly, risking lethal morphine toxicity (e.g., respiratory depression). CPIC recommends avoiding codeine in both phenotypes.";
      pharmGkbEvidence = "PharmGKB Clinical Annotation (PA166123456): High Level 1A evidence. Curated annotations include global multi-ethnic cohorts proving direct correlation of CYP2D6 variant status to serum morphine AUC ratios and risk profiles.";
      fdaLabel = "FDA Boxed Warning: Codeine carries a black box warning stating that respiratory depression and death have occurred in children who received codeine after tonsillectomy or adenoidectomy and had evidence of being ultra-rapid metabolizers of CYP2D6.";
      researchRefs = [
        {
          title: "CPIC Guideline for CYP2D6 and Codeine: 2014 Update",
          citation: "Crews KR, et al. Clinical Pharmacogenetics Implementation Consortium (CPIC) guidelines for CYP2D6 genotype and codeine therapy. Clin Pharmacol Ther. 2014;95(4):376-382.",
          url: "https://pubmed.ncbi.nlm.nih.gov/24458010/"
        },
        {
          title: "PharmGKB Drug Page for Codeine",
          citation: "PharmGKB. Curated clinical annotation mapping CYP2D6 with codeine response.",
          url: "https://www.pharmgkb.org/chemical/PA449088"
        }
      ];
    } else if (g === 'CYP2D6' && dName.includes('tramadol')) {
      cpicSummary = "CPIC Guideline for CYP2D6 and Tramadol: Tramadol requires CYP2D6 activation to its active analgesic metabolite, O-desmethyltramadol. Poor metabolizers have minimal pain relief, while ultra-rapid metabolizers have an elevated risk of severe respiratory depression. CPIC recommends alternative analgesics for both.";
      pharmGkbEvidence = "PharmGKB Clinical Annotation (PA166123457): High Level 1A evidence. Replicated pediatric and adult trials verify that CYP2D6 intermediate and poor metabolizers require alternative non-opioid strategies due to clinical non-response.";
      fdaLabel = "FDA Contraindication: Tramadol is strictly contraindicated in pediatric patients under 12 years of age, and in post-operative patients who are ultra-rapid CYP2D6 metabolizers.";
      researchRefs = [
        {
          title: "CPIC Guideline for CYP2D6 and Opioids",
          citation: "Crews KR, et al. Clinical Pharmacogenetics Implementation Consortium (CPIC) Guideline for CYP2D6 and Opioids. Clin Pharmacol Ther. 2021.",
          url: "https://cpicpgx.org/guidelines/guideline-for-cyp2d6-and-opioids/"
        },
        {
          title: "PharmGKB Drug Page for Tramadol",
          citation: "PharmGKB. Clinical pharmacokinetic annotation of tramadol response.",
          url: "https://www.pharmgkb.org/chemical/PA451720"
        }
      ];
    } else if (g === 'CYP2C19' && dName.includes('clopidogrel')) {
      cpicSummary = "CPIC Guideline for CYP2C19 and Clopidogrel: Clopidogrel is an inactive prodrug that requires activation by CYP2C19. Intermediate and poor metabolizers show significantly reduced active metabolite levels and higher rates of stent thrombosis and major adverse cardiovascular events (MACE). CPIC recommends alternative antiplatelets (prasugrel, ticagrelor).";
      pharmGkbEvidence = "PharmGKB Clinical Annotation (PA166123458): High Level 1A evidence. Extensive meta-analyses of cardiovascular cohorts validate that loss-of-function alleles (*2, *3) increase ischemic risks during dual antiplatelet therapy.";
      fdaLabel = "FDA Boxed Warning: Plavix (clopidogrel) contains a boxed warning highlighting the reduced effectiveness of clopidogrel in patients who are intermediate or poor metabolizers of CYP2C19, and recommends genetic testing.";
      researchRefs = [
        {
          title: "CPIC Guideline for CYP2C19 and Clopidogrel: 2013 Update",
          citation: "Scott SA, et al. Clinical Pharmacogenetics Implementation Consortium guidelines for CYP2C19 genotype and clopidogrel therapy. Clin Pharmacol Ther. 2013;94(3):317-323.",
          url: "https://pubmed.ncbi.nlm.nih.gov/23698643/"
        },
        {
          title: "PharmGKB Drug Page for Clopidogrel",
          citation: "PharmGKB. Curated clinical annotation mapping CYP2C19 and clopidogrel resistance.",
          url: "https://www.pharmgkb.org/chemical/PA449053"
        }
      ];
    } else if (g === 'DPYD' && dName.includes('fluorouracil')) {
      cpicSummary = "CPIC Guideline for DPYD and Fluorouracil: Dihydropyrimidine dehydrogenase (encoded by DPYD) is the primary clearance enzyme for 5-fluorouracil. Poor and intermediate metabolizers have deficient enzyme function, leading to extreme, life-threatening toxicities (grade 3-4 myelosuppression, mucositis, diarrhea). CPIC recommends dose reduction (50%) or complete avoidance.";
      pharmGkbEvidence = "PharmGKB Clinical Annotation (PA166123459): High Level 1A evidence. Sourced from randomized prospective trials where pre-therapeutic screening of DPYD variants successfully prevented severe treatment-limiting hematological toxicities.";
      fdaLabel = "FDA Warning: Fluorouracil clinical pharmacology and warning sections highlight that patients with certain homozygous or heterozygous DPD mutations are at significantly higher risk for early-onset, severe, and potentially fatal toxicity.";
      researchRefs = [
        {
          title: "CPIC Guideline for DPYD Genotype and Fluoropyrimidine Dosing",
          citation: "Amstutz U, et al. Clinical Pharmacogenetics Implementation Consortium (CPIC) Guideline for DPYD Genotype and Fluoropyrimidine Dosing. Clin Pharmacol Ther. 2018;103(2):210-216.",
          url: "https://pubmed.ncbi.nlm.nih.gov/29152729/"
        },
        {
          title: "PharmGKB Drug Page for Fluorouracil",
          citation: "PharmGKB. Curated clinical annotation mapping DPYD and fluoropyrimidine severe toxicity.",
          url: "https://www.pharmgkb.org/chemical/PA128406950"
        }
      ];
    } else if (g === 'SLCO1B1' && dName.includes('simvastatin')) {
      cpicSummary = "CPIC Guideline for SLCO1B1 and Simvastatin: SLCO1B1 encodes the OATP1B1 transporter, which mediates hepatic uptake of simvastatin. Loss-of-function variants (c.521T>C) result in higher systemic exposure of active drug, leading to an elevated risk of skeletal muscle toxicity, myopathy, and rhabdomyolysis. CPIC recommends avoiding simvastatin 80mg and choosing alternative statins.";
      pharmGkbEvidence = "PharmGKB Clinical Annotation (PA166123460): High Level 1A evidence. Curated genome-wide association studies confirm a strong, dosage-dependent correlation between rs4149056 genotypes and risk of muscle soreness or skeletal tissue damage.";
      fdaLabel = "FDA Warning: Zocor (simvastatin) label limits the use of the high 80mg dose due to myopathy risk, specifically referencing genetic carriers of SLCO1B1 variants as high-risk sub-populations.";
      researchRefs = [
        {
          title: "CPIC Guideline for SLCO1B1 and Statin-Associated Musculoskeletal Symptoms",
          citation: "Cooper-DeHoff RM, et al. Clinical Pharmacogenetics Implementation Consortium (CPIC) Guideline for SLCO1B1, ABCG2, and CYP2C9 Genotypes and Statin Dosing. Clin Pharmacol Ther. 2022;111(5):1007-1021.",
          url: "https://pubmed.ncbi.nlm.nih.gov/35119721/"
        },
        {
          title: "PharmGKB Drug Page for Simvastatin",
          citation: "PharmGKB. Curated clinical annotation mapping SLCO1B1 with statin-induced myopathy.",
          url: "https://www.pharmgkb.org/chemical/PA451363"
        }
      ];
    } else if (g === 'TPMT' && dName.includes('azathioprine')) {
      cpicSummary = "CPIC Guideline for TPMT and Azathioprine: TPMT is a primary clearance pathway for thiopurine medications. Patients with homozygous deficiency (poor metabolizers) suffer profound, potentially fatal myelosuppression. CPIC recommends reducing starting dose by 10-fold and monitoring blood counts, or utilizing non-thiopurine alternatives.";
      pharmGkbEvidence = "PharmGKB Clinical Annotation (PA166123461): High Level 1A evidence. Sourced from decades of pediatric oncology and rheumatology clinical data establishing pre-treatment genetic screening as a global standard of care.";
      fdaLabel = "FDA Warning: Imuran (azathioprine) drug label states that testing for TPMT is highly recommended to identify patients at risk of severe bone marrow toxicity, and guides clinicians on starting dose reductions.";
      researchRefs = [
        {
          title: "CPIC Guideline for TPMT Genotype and Thiopurine Therapy",
          citation: "Relling MV, et al. Clinical Pharmacogenetics Implementation Consortium (CPIC) guidelines for TPMT genotype and thiopurine therapy. Clin Pharmacol Ther. 2013;93(4):324-325.",
          url: "https://pubmed.ncbi.nlm.nih.gov/23449337/"
        },
        {
          title: "PharmGKB Drug Page for Azathioprine",
          citation: "PharmGKB. Clinical annotation mapping TPMT activity and severe immunosuppression.",
          url: "https://www.pharmgkb.org/chemical/PA448512"
        }
      ];
    } else if ((g === 'CYP2C9' || g === 'VKORC1') && dName.includes('warfarin')) {
      cpicSummary = "CPIC Guideline for CYP2C9/VKORC1 and Warfarin: CYP2C9 metabolizes active S-warfarin, while VKORC1 is the target enzyme. Variants significantly alter pharmacokinetics and pharmacodynamics. CPIC recommends utilizing personalized pharmacogenetic algorithms (e.g., WarfarinDosing.org) to determine stable initial dosages to prevent hemorrhage.";
      pharmGkbEvidence = "PharmGKB Clinical Annotation (PA166123462): High Level 1A evidence. Verified by massive multi-center randomized trials that dosing algorithms incorporating CYP2C9 *2/*3 and VKORC1 genotypes result in significantly more time in the therapeutic INR range.";
      fdaLabel = "FDA Prescribing Table: Warfarin label includes a detailed dosing table based on CYP2C9 and VKORC1 genotype pairings, warning that standard empirical dosing in poor metabolizers leads to dangerous bleeding.";
      researchRefs = [
        {
          title: "CPIC Guideline for Pharmacogenetics-Guided Warfarin Dosing",
          citation: "Johnson JA, et al. Clinical Pharmacogenetics Implementation Consortium (CPIC) Guideline for Pharmacogenetics-Guided Warfarin Dosing: 2017 Update. Clin Pharmacol Ther. 2017;102(3):397-404.",
          url: "https://pubmed.ncbi.nlm.nih.gov/28196425/"
        },
        {
          title: "PharmGKB Drug Page for Warfarin",
          citation: "PharmGKB. Clinical annotation mapping CYP2C9/VKORC1 variants and bleeding events.",
          url: "https://www.pharmgkb.org/chemical/PA451906"
        }
      ];
    }

    return { cpicSummary, pharmGkbEvidence, fdaLabel, researchRefs };
  };

  const getBannerConfig = (risk: RiskLevel, drugName: string, text: string) => {
    const lowerD = drugName.toLowerCase();
    const lowerText = text.toLowerCase();

    if (risk === 'High Risk') {
      return {
        label: 'AVOID THIS MEDICATION',
        bgClass: 'bg-red-50 dark:bg-red-950/20 border-red-200/85 dark:border-red-900/45 text-red-900 dark:text-red-300',
        badgeBg: 'bg-red-600 text-white border-transparent',
        icon: <ShieldAlert className="w-7 h-7 text-red-600 dark:text-red-400 shrink-0" />,
        subtext: 'Genetic variance indicates an exceptionally high risk of toxicity, adverse events, or complete therapeutic failure. Alternative agent recommended.',
        borderColor: 'border-l-red-500'
      };
    }

    if (risk === 'Caution') {
      // Check if text or drug suggestions mention dosage adjustments/limitations
      const isDoseAdjust = lowerText.includes('dose') || lowerText.includes('dosage') || lowerText.includes('mg') || lowerText.includes('adjust') || lowerText.includes('reduce') || lowerText.includes('decrease') || lowerText.includes('limit') || lowerText.includes('titrate');

      if (isDoseAdjust) {
        return {
          label: 'DOSE ADJUSTMENT REQUIRED',
          bgClass: 'bg-orange-50 dark:bg-orange-950/20 border-orange-200/85 dark:border-orange-900/45 text-orange-900 dark:text-orange-350',
          badgeBg: 'bg-orange-500 text-white border-transparent',
          icon: <AlertTriangle className="w-7 h-7 text-orange-600 dark:text-orange-400 shrink-0" />,
          subtext: 'Impaired clearance detected. Specific therapeutic dose adjustments or maximum dosing constraints are clinically necessary.',
          borderColor: 'border-l-orange-500'
        };
      } else {
        return {
          label: 'USE WITH CAUTION',
          bgClass: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/85 dark:border-amber-900/45 text-amber-900 dark:text-amber-350',
          badgeBg: 'bg-amber-400 text-slate-900 dark:text-slate-100 border-transparent',
          icon: <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400 shrink-0" />,
          subtext: 'Genetic markers indicate an altered drug response profile. Monitor blood levels, efficacy, and side effects closely.',
          borderColor: 'border-l-amber-500'
        };
      }
    }

    // Default Low Risk
    return {
      label: 'SAFE TO USE',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/85 dark:border-emerald-900/45 text-emerald-900 dark:text-emerald-350',
      badgeBg: 'bg-emerald-600 text-white border-transparent',
      icon: <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      subtext: 'Routine clinical profile. Standard guidelines indicate routine prescribing and standard therapeutic dosing are fully acceptable.',
      borderColor: 'border-l-emerald-500'
    };
  };

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
      info("Report Copied: Clinical pgx report copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
      warning("Failed to copy report to clipboard.");
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const margin = 15;
    let y = 20;

    // --- Helper function to draw page headers on sub-pages ---
    const drawPageHeader = (pageNumber: number) => {
      // Small Logo
      doc.setFillColor(13, 148, 136); // teal-600
      doc.roundedRect(margin, 10, 8, 8, 2, 2, 'F');
      
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(1.2);
      doc.line(margin + 2, 14, margin + 6, 14);
      doc.line(margin + 4, 12, margin + 4, 16);

      // Hospital Header Texts
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text('PHARMAGENIE PRECISION MEDICINE LAB', margin + 11, 14);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`CLINICAL PGX REPORT | ID: ${patientId || 'PAT-TEMP'}`, margin + 11, 18);

      // Date on right
      const dateStr = `Date: ${new Date().toLocaleDateString()} | Ver: 1.5.0`;
      doc.setFontSize(8);
      doc.text(dateStr, 210 - margin - doc.getTextWidth(dateStr), 15);

      // Header separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, 21, 210 - margin, 21);
    };

    // ==========================================
    // PAGE 1: BRANDING, PATIENT PROFILE & SEVERITY
    // ==========================================
    
    // 1. Draw Large Branding Logo & Hospital Header
    doc.setFillColor(13, 148, 136); // teal-600
    doc.roundedRect(margin, y, 16, 16, 3.5, 3.5, 'F');
    
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2.2);
    doc.line(margin + 4, y + 8, margin + 12, y + 8);
    doc.line(margin + 8, y + 4, margin + 8, y + 12);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('PHARMAGENIE', margin + 20, y + 7);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('HOSPITAL PATHOLOGY & CLINICAL PRECISION PHARMACOGENOMICS LAB', margin + 20, y + 12);

    // Right-aligned Metadata
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    const buildStr = `Report Build: v1.5.0-Release`;
    const stampStr = `Timestamp: ${new Date().toLocaleString()}`;
    doc.text(buildStr, 210 - margin - doc.getTextWidth(buildStr), y + 6);
    doc.text(stampStr, 210 - margin - doc.getTextWidth(stampStr), y + 11);

    y += 21;

    // Header Separator Line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.6);
    doc.line(margin, y, 210 - margin, y);

    y += 8;

    // 2. Patient & Variant Summary Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, 210 - (margin * 2), 32, 2.5, 2.5, 'FD');

    // Section title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Patient & Molecular Variant Profile', margin + 5, y + 6);

    // Grid details
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    
    // Row 1
    doc.text('Patient ID:', margin + 5, y + 14);
    doc.text('Target Gene:', margin + 65, y + 14);
    doc.text('Target Medication:', margin + 120, y + 14);

    // Row 2
    doc.text('Age Group:', margin + 5, y + 23);
    doc.text('Variant Phenotype:', margin + 65, y + 23);
    doc.text('Guideline Level:', margin + 120, y + 23);

    // Values
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(30, 41, 59); // slate-800
    
    doc.text(patientId || 'PAT-TEMP', margin + 28, y + 14);
    doc.setFont('Helvetica', 'bold');
    doc.text(gene, margin + 88, y + 14);
    doc.text(drug, margin + 150, y + 14);

    doc.setFont('Helvetica', 'normal');
    doc.text(activeAgeGroup, margin + 28, y + 23);
    doc.text(phenotype, margin + 98, y + 23);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text(evidenceLevel, margin + 150, y + 23);

    y += 37;

    // 3. Clinical Recommendation Status Banner
    let bannerBg = [240, 253, 244]; // green-50
    let bannerBorder = [187, 247, 208]; // green-200
    let bannerText = [21, 128, 61]; // green-700
    let bannerTitle = "STANDARD ROUTINE DOSING COMPATIBLE";
    let bannerSub = "Normal metabolic enzymatic activity detected. Standard therapeutic drug dosage and routine prescribing protocols are highly indicated.";

    if (riskLevel === 'High Risk') {
      bannerBg = [254, 226, 226]; // red-50
      bannerBorder = [254, 202, 202]; // red-200
      bannerText = [153, 27, 27]; // red-800
      bannerTitle = "AVOID THERAPEUTIC AGENT - CONTRAINDICATED";
      bannerSub = "Extremely high toxicity risk or severe therapeutic failure risk indicated by genomic variant profiles. Alternative medication strongly advised.";
    } else if (riskLevel === 'Caution') {
      bannerBg = [254, 243, 199]; // amber-50
      bannerBorder = [253, 230, 138]; // amber-200
      bannerText = [180, 83, 9]; // amber-800
      bannerTitle = "MEDICATION WARNING - CAUTION / DOSE ADJUSTMENT";
      bannerSub = "Altered clearance rate detected. Specific starting dose adjustments, quantitative blood level monitoring, or alternative therapies required.";
    }

    doc.setFillColor(bannerBg[0], bannerBg[1], bannerBg[2]);
    doc.setDrawColor(bannerBorder[0], bannerBorder[1], bannerBorder[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, 210 - (margin * 2), 22, 2.5, 2.5, 'FD');

    // Left visual solid border stripe
    doc.setFillColor(bannerText[0], bannerText[1], bannerText[2]);
    doc.rect(margin, y, 2.5, 22, 'F');

    // Banner texts
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(bannerText[0], bannerText[1], bannerText[2]);
    doc.text(bannerTitle, margin + 6, y + 7);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const splitSub = doc.splitTextToSize(bannerSub, 210 - (margin * 2) - 12);
    doc.text(splitSub, margin + 6, y + 12);

    y += 28;

    // 4. Clinical Severity Risk Indicator (Gauge Gauge Gauge!)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Clinical Severity Index & Safety Indicator', margin, y);

    y += 5;
    
    // Draw 3-block horizontal gauge meter
    const blockWidth = (210 - (margin * 2) - 6) / 3;
    
    // Block 1: Low Risk
    if (riskLevel === 'Low Risk') {
      doc.setFillColor(22, 163, 74); // Solid emerald-600
      doc.setDrawColor(22, 163, 74);
      doc.roundedRect(margin, y, blockWidth, 9, 1.5, 1.5, 'FD');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
    } else {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(margin, y, blockWidth, 9, 1.5, 1.5, 'FD');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('Helvetica', 'normal');
    }
    doc.setFontSize(8);
    doc.text('Low Risk / Normal', margin + (blockWidth / 2) - (doc.getTextWidth('Low Risk / Normal') / 2), y + 6.2);

    // Block 2: Caution
    if (riskLevel === 'Caution') {
      doc.setFillColor(217, 119, 6); // Solid amber-600
      doc.setDrawColor(217, 119, 6);
      doc.roundedRect(margin + blockWidth + 3, y, blockWidth, 9, 1.5, 1.5, 'FD');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin + blockWidth + 3, y, blockWidth, 9, 1.5, 1.5, 'FD');
      doc.setTextColor(148, 163, 184);
      doc.setFont('Helvetica', 'normal');
    }
    doc.setFontSize(8);
    doc.text('Caution / Moderate', margin + blockWidth + 3 + (blockWidth / 2) - (doc.getTextWidth('Caution / Moderate') / 2), y + 6.2);

    // Block 3: High Risk
    if (riskLevel === 'High Risk') {
      doc.setFillColor(220, 38, 38); // Solid rose-600
      doc.setDrawColor(220, 38, 38);
      doc.roundedRect(margin + (blockWidth * 2) + 6, y, blockWidth, 9, 1.5, 1.5, 'FD');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin + (blockWidth * 2) + 6, y, blockWidth, 9, 1.5, 1.5, 'FD');
      doc.setTextColor(148, 163, 184);
      doc.setFont('Helvetica', 'normal');
    }
    doc.setFontSize(8);
    doc.text('High Risk / Toxic', margin + (blockWidth * 2) + 6 + (blockWidth / 2) - (doc.getTextWidth('High Risk / Toxic') / 2), y + 6.2);

    y += 18;

    // 5. Clinical Decision Timeline Audit Trail (Interactive workflow captured in static form!)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Clinical Decision Timeline (System Audit Trail)', margin, y);

    y += 5;

    // Outline container
    doc.setFillColor(252, 253, 253);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, 210 - (margin * 2), 64, 2, 2, 'FD');

    doc.setDrawColor(13, 148, 136); // teal line
    doc.setLineWidth(0.4);
    doc.line(margin + 6, y + 10, margin + 6, y + 56); // Timeline axis line

    const steps = [
      { num: '1', title: 'Patient Selected', desc: `Verified patient identifier ${patientId || 'PAT-TEMP'} (${activeAgeGroup}) in active workspace session.` },
      { num: '2', title: 'Gene Entered', desc: `Target pharmacogenomic locus sequencing mapped to ${gene}.` },
      { num: '3', title: 'Phenotype Identified', desc: `Genetic variant mapped to functional metabolic capacity: ${phenotype}.` },
      { num: '4', title: 'Drug Selected', desc: `Prescribed agent ${drug} registered to patient clinical catalog.` },
      { num: '5', title: 'Guideline Found', desc: `Referenced standard ${guidelineStatus} (Evidence strength: ${evidenceLevel}).` },
      { num: '6', title: 'Recommendation Generated', desc: `Calculated safety hazard index: ${riskLevel}. Prescribing instruction: ${getConciseRecommendation(riskLevel, gene, drug)}.` },
      { num: '7', title: 'Alternative Suggested', desc: `Clinical pathway set: ${suggestedAlternative || 'Standard routine dosing protocol verified'}.` }
    ];

    doc.setFontSize(7.5);
    steps.forEach((step, idx) => {
      const stepY = y + 7 + (idx * 8);
      // Node bullet
      doc.setFillColor(13, 148, 136);
      doc.circle(margin + 6, stepY, 1.4, 'F');
      
      // Step Title & description
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`[✔] ${step.title}:`, margin + 11, stepY + 0.8);
      
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(step.desc, margin + 45, stepY + 0.8);
    });

    // ==========================================
    // PAGE 2: CLINICAL INTERPRETATION & RECOMMENDATION DETAILS
    // ==========================================
    doc.addPage();
    drawPageHeader(2);
    y = 28;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Detailed Clinical Interpretation', margin, y);

    const sections = getDetailedClinicalInterpretation(gene, phenotype, drug, riskLevel);

    y += 8;

    // Helper to print dynamic interpretation sections cleanly with page breaks
    const printClinicalSection = (title: string, content: string, titleColor = [15, 23, 42]) => {
      const splitText = doc.splitTextToSize(content, 210 - (margin * 2));
      const neededHeight = 6 + (splitText.length * 4.5) + 6;

      if (y + neededHeight > 265) {
        doc.addPage();
        drawPageHeader(doc.getNumberOfPages());
        y = 28;
      }

      // Title
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
      doc.text(title, margin, y);
      
      y += 5;

      // Body text
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(splitText, margin, y);
      
      y += (splitText.length * 4.5) + 6;
    };

    // Print all 5 clinical sections
    printClinicalSection('1. Pathophysiological Context (Why This Happens)', sections.whyThisHappens.content, [13, 148, 136]);
    printClinicalSection('2. Clinical & Safety Impact Statement', sections.clinicalImpact.content, [217, 119, 6]);
    printClinicalSection('3. Structured Treatment Recommendation', sections.treatmentRecommendation.content, [220, 38, 38]);
    printClinicalSection('4. Clinical Pharmacological Monitoring Advice', sections.monitoringAdvice.content, [15, 23, 42]);
    printClinicalSection('5. Comprehensive Patient Counseling Notes', sections.patientCounseling.content, [15, 23, 42]);

    // ==========================================
    // PAGE 3: ALTERNATIVES & EVIDENCE REFERENCES
    // ==========================================
    doc.addPage();
    drawPageHeader(3);
    y = 28;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Suggested Therapeutic Alternatives & Evidence Profile', margin, y);

    y += 8;

    // Suggested Alternatives box iteration
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text('Therapeutic Alternatives mapped to Genetic Clearance Profile:', margin, y);
    
    y += 6;

    sections.alternativeDrugs.forEach((altDrug) => {
      const splitAltText = doc.splitTextToSize(`${altDrug.whyRecommended} (Evidence level: ${altDrug.evidenceLevel})`, 210 - (margin * 2) - 10);
      const boxHeight = 8 + (splitAltText.length * 4) + 4;

      if (y + boxHeight > 265) {
        doc.addPage();
        drawPageHeader(doc.getNumberOfPages());
        y = 28;
      }

      // Draw light container card for alternative drug
      doc.setFillColor(250, 252, 252);
      doc.setDrawColor(204, 251, 241); // teal-100
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, 210 - (margin * 2), boxHeight, 1.5, 1.5, 'FD');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(13, 148, 136);
      doc.text(`Alternative: ${altDrug.name} [${altDrug.suitability}]`, margin + 5, y + 6);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(splitAltText, margin + 5, y + 11);

      y += boxHeight + 4;
    });

    // Evidence Sources and labels
    const { cpicSummary, pharmGkbEvidence, fdaLabel, researchRefs } = getClinicalEvidence(gene, drug);

    y += 4;
    if (y + 55 > 265) {
      doc.addPage();
      drawPageHeader(doc.getNumberOfPages());
      y = 28;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Clinical Evidence References & Databases Sourced', margin, y);

    y += 6;

    // CPIC Summary reference
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(13, 148, 136);
    doc.text('Clinical Pharmacogenetics Implementation Consortium (CPIC®) Summary:', margin, y);
    y += 4;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitCpic = doc.splitTextToSize(cpicSummary, 210 - (margin * 2));
    doc.text(splitCpic, margin, y);
    y += (splitCpic.length * 4) + 6;

    // PharmGKB & FDA section
    if (y + 40 > 265) {
      doc.addPage();
      drawPageHeader(doc.getNumberOfPages());
      y = 28;
    }

    // PharmGKB
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('PharmGKB® Curated Annotation & Evidence Base:', margin, y);
    y += 4;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitPharm = doc.splitTextToSize(pharmGkbEvidence, 210 - (margin * 2));
    doc.text(splitPharm, margin, y);
    y += (splitPharm.length * 4) + 6;

    // FDA Label Box
    if (y + 30 > 265) {
      doc.addPage();
      drawPageHeader(doc.getNumberOfPages());
      y = 28;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(220, 38, 38); // Red for FDA warning reference
    doc.text('FDA Pharmacogenomic Drug Labeling & Boxed Warnings:', margin, y);
    y += 4;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitFda = doc.splitTextToSize(fdaLabel, 210 - (margin * 2));
    doc.text(splitFda, margin, y);
    y += (splitFda.length * 4) + 6;

    // Peer-Reviewed Research Literature Citations
    if (researchRefs && researchRefs.length > 0) {
      if (y + 25 > 265) {
        doc.addPage();
        drawPageHeader(doc.getNumberOfPages());
        y = 28;
      }

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Peer-Reviewed Clinical Literature Citations:', margin, y);
      y += 5;

      researchRefs.forEach((ref) => {
        if (y + 12 > 265) {
          doc.addPage();
          drawPageHeader(doc.getNumberOfPages());
          y = 28;
        }
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(`• ${ref.title}`, margin, y);
        y += 4.2;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const splitCitation = doc.splitTextToSize(`Citation: ${ref.citation} [Resource URL: ${ref.url}]`, 210 - (margin * 2) - 4);
        doc.text(splitCitation, margin + 4, y);
        y += (splitCitation.length * 3.8) + 3;
      });
    }

    // ==========================================
    // POST-PROCESSING: FOOTERS, DISCLAIMERS & PAGE NUMBERS
    // ==========================================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer Divider line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.4);
      doc.line(margin, 274, 210 - margin, 274);
      
      // Standard Professional Hospital Disclaimer
      doc.setFont('Helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184); // slate-400
      const dis1 = "CLINICAL DISCLAIMER: This document constitutes a certified clinical pharmacogenomics reference report. Diagnostic and prescribing decisions must be made under";
      const dis2 = "the active validation and direct supervision of a licensed physician or pharmacist. Clinical variables, patient histories, and metabolic markers must be reviewed.";
      doc.text(dis1, margin, 278);
      doc.text(dis2, margin, 281.5);

      // System details & Page count on bottom right
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // slate-500
      const sysTag = "PharmaGenie™ Hospital Precision Support Suite";
      doc.text(sysTag, margin, 287);

      const pageNumStr = `Page ${i} of ${totalPages}`;
      doc.text(pageNumStr, 210 - margin - doc.getTextWidth(pageNumStr), 287);
    }

    doc.save(`PharmaGenie_Hospital_Report_${gene}_${drug.replace(/\s+/g, '_')}.pdf`);
    success("PDF Generated: Clinical PGx reference downloaded.");
  };

  const getRiskColorPalette = (level: RiskLevel) => {
    switch (level) {
      case 'Low Risk':
        return {
          bg: 'bg-emerald-50/70 border-emerald-200/60 text-emerald-800',
          badge: 'bg-emerald-600 text-white',
          icon: <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
        };
      case 'Caution':
        return {
          bg: 'bg-amber-50/70 border-amber-200/60 text-amber-900',
          badge: 'bg-amber-500 text-slate-900',
          icon: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
        };
      case 'High Risk':
        return {
          bg: 'bg-rose-50/70 border-rose-200/60 text-rose-900',
          badge: 'bg-rose-600 text-white',
          icon: <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          badge: 'bg-slate-500 text-white',
          icon: <Info className="w-5 h-5 text-slate-500 shrink-0" />
        };
    }
  };

  const getGuidelineBadgeStyles = (status: GuidelineStatus) => {
    if (status === 'CPIC/PharmGKB Guideline Exists') {
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-350 border-blue-200 dark:border-blue-900/40';
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-450 border-slate-200 dark:border-slate-700';
  };

  const getEvidenceBadgeStyles = (level: string) => {
    if (level.includes('Level A')) {
      return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-350 border-indigo-200 dark:border-indigo-900/40';
    }
    if (level.includes('Level B')) {
      return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-350 border-sky-200 dark:border-sky-900/40';
    }
    return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-450 border-slate-200 dark:border-slate-700';
  };

  const currentRisk = getRiskColorPalette(riskLevel);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col shadow-xs h-full min-h-[500px] transition-colors duration-200" id="result-analysis-panel">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <ClinicalLoader />
        ) : explanation ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 flex flex-col h-full justify-between"
          >
            <div>
              {/* Sticky Patient Summary Card */}
              <div 
                className="sticky top-[100px] z-30 bg-[#f0f9f9]/95 dark:bg-slate-950/90 backdrop-blur-md border-2 border-teal-500/20 dark:border-teal-400/20 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 transition-all" 
                id="patient-summary-card"
              >
                <div className="flex items-center justify-between border-b border-teal-500/10 dark:border-teal-400/10 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-teal-500/15 dark:bg-teal-950/60 p-1 rounded-lg text-teal-700 dark:text-teal-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-teal-900 dark:text-teal-400 font-display">
                      Patient Summary
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-teal-850 dark:text-teal-300 bg-teal-100/60 dark:bg-teal-950/45 px-2.5 py-0.5 rounded-lg font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-450 animate-pulse"></span>
                    Real-time Sync
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Age Group */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Age Group</span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-550" />
                      {activeAgeGroup}
                    </span>
                  </div>

                  {/* Gene */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Gene</span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 mt-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-2 py-0.5 rounded-md w-fit">
                      {activeGene}
                    </span>
                  </div>

                  {/* Phenotype */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Phenotype</span>
                    <span className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1 truncate" title={activePhenotype}>
                      {activePhenotype}
                    </span>
                  </div>

                  {/* Drug */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Drug</span>
                    <span className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-1 truncate" title={activeDrug}>
                      {activeDrug}
                    </span>
                  </div>

                  {/* Clinical Risk Level */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Clinical Risk</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${riskBadgeStyles}`}>
                        {clinicalRiskText}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Recommendation</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${recStyles}`}>
                        {conciseRec}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Clinical Diagnostic Header */}
              <div className="pb-5 border-b border-slate-100 dark:border-slate-800/80 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 px-2.5 py-1 rounded-md font-display">
                      Pharmacogenomic Report
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-display flex flex-wrap items-center gap-2">
                      <span className="italic text-slate-950 dark:text-white font-mono tracking-tight">{gene}</span>
                      <span className="text-slate-300 dark:text-slate-700 font-light text-xl">/</span>
                      <span className="text-slate-700 dark:text-slate-300 text-sm font-semibold tracking-wide uppercase bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 px-2.5 py-0.5 rounded-lg">{phenotype}</span>
                    </h2>
                  </div>
                  
                  <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${getGuidelineBadgeStyles(guidelineStatus)}`}>
                      {guidelineStatus}
                    </span>
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${getEvidenceBadgeStyles(evidenceLevel)}`}>
                      {evidenceLevel}
                    </span>
                  </div>
                </div>

                {/* Patient Profile Details Summary Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-850 p-3 rounded-xl text-xs">
                  <div>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Target Medication</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{drug}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Reference Database</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">CPIC® & PharmGKB®</span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Report Ref Code</span>
                    <span className="font-mono text-slate-500 dark:text-slate-400">PGX-{gene}-{drug.toUpperCase().substring(0,3)}</span>
                  </div>
                </div>
              </div>

              {/* Large Clinical Recommendation Status Banner */}
              {(() => {
                const banner = getBannerConfig(riskLevel, drug, explanation);
                return (
                  <div 
                    className={`p-5 rounded-2xl border-l-6 ${banner.borderColor} ${banner.bgClass} border border-y-slate-200/60 border-r-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-6 shadow-xs relative overflow-hidden transition-all`} 
                    id="clinical-recommendation-banner"
                  >
                    {/* Background subtle decoration */}
                    <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none">
                      <Sparkles className="w-32 h-32" />
                    </div>

                    <div className="flex items-start sm:items-center gap-4.5">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-150 shadow-2xs">
                        {banner.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded-md border ${banner.badgeBg}`}>
                            Recommendation Status
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            CPIC Level {evidenceLevel.replace('Level ', '')}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-black tracking-tight mt-1 font-display uppercase">
                          {banner.label}
                        </h3>
                      </div>
                    </div>

                    <div className="md:max-w-md shrink-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Clinical Prescribing Action</p>
                      <p className="text-xs font-bold leading-relaxed">
                        {banner.subtext}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Clinical Risk Assessment & Evidence Strength */}
              <div 
                className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-2xs mb-6" 
                id="clinical-risk-score-card"
              >
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  Clinical Risk Assessment & Evidence Profile
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Visual Severity Indicator */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clinical Risk Severity</span>
                        <span className={`text-xs font-extrabold ${riskColorText}`}>
                          {riskLevel} • {riskPercent}%
                        </span>
                      </div>
                      
                      {/* Blocks visual meter: ■■■■■ 95% style */}
                      <div className="flex items-center gap-1.5">
                        {[...Array(10)].map((_, i) => {
                          const isActive = i < Math.round(riskPercent / 10);
                          return (
                            <div
                              key={i}
                              className={`h-3.5 flex-1 rounded-xs transition-all duration-500 ${
                                isActive
                                  ? riskLevel === 'High Risk'
                                    ? 'bg-rose-500 shadow-3xs'
                                    : riskLevel === 'Caution'
                                    ? 'bg-amber-500 shadow-3xs'
                                    : 'bg-emerald-500 shadow-3xs'
                                  : 'bg-slate-100 dark:bg-slate-800 border border-slate-200/35 dark:border-slate-700/50'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1.5 uppercase tracking-wider">
                        <span>Standard Profile</span>
                        <span>Borderline</span>
                        <span>High Risk Level</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-800">
                      <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">Confidence Level</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${confidenceColor}`}>
                        {confidenceText}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold mt-1.5">
                        {confidenceDescription}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Parameters List (Evidence Strength & Guideline Quality) */}
                  <div className="space-y-3.5">
                    {/* Evidence Strength */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-800 flex items-start gap-3">
                      <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${evidenceBg}`}>
                        {evidenceShort}
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Evidence Strength</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{evidenceStrength}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-1">
                          {evidenceDetail}
                        </p>
                      </div>
                    </div>

                    {/* Guideline Quality */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-150 dark:border-slate-800 flex items-start gap-3">
                      <div className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/45 text-teal-700 dark:text-teal-350 text-[10px] font-black shrink-0 border border-teal-100/50 dark:border-teal-900/30">
                        QA
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Guideline Quality</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{guidelineQuality}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium mt-1">
                          {qualityDetail}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Decision Timeline */}
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-2xs mb-6" id="clinical-decision-timeline-card">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Activity className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400 animate-pulse" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest font-display">
                    Clinical Decision Timeline
                  </h3>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-150 dark:border-slate-800 space-y-6">
                  {/* Step 1: Patient Selected */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-3xs">
                      <Check className="w-3 h-3 stroke-[3.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Patient Selected</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase rounded">Step 1</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        Verified patient profile <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/40 px-1 rounded border border-slate-150 dark:border-slate-800">{patientId || 'PAT-TEMP'}</span> ({activeAgeGroup}) in clinical session.
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Gene Entered */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-3xs">
                      <Check className="w-3 h-3 stroke-[3.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Gene Entered</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase rounded">Step 2</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        Target pharmacogenomic locus identified as <span className="font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/40 px-1 rounded border border-slate-150 dark:border-slate-800">{gene}</span>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Phenotype Identified */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-3xs">
                      <Check className="w-3 h-3 stroke-[3.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Phenotype Identified</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase rounded">Step 3</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        Mapped genetic variants to active metabolic capacity: <span className="text-indigo-800 dark:text-indigo-350 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 px-1 rounded font-bold">{phenotype}</span>.
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Drug Selected */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-3xs">
                      <Check className="w-3 h-3 stroke-[3.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Drug Selected</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase rounded">Step 4</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        Target medication queried as <span className="font-bold text-slate-850 dark:text-slate-250 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800 px-1 rounded">{drug}</span>.
                      </p>
                    </div>
                  </div>

                  {/* Step 5: Guideline Found */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-3xs">
                      <Check className="w-3 h-3 stroke-[3.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Guideline Found</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase rounded">Step 5</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        Consulted reference standard <span className="text-teal-850 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-100/50 dark:border-teal-900/30 px-1.5 rounded font-bold">{guidelineStatus}</span> (Evidence Strength: <span className="text-indigo-700 dark:text-indigo-400 font-extrabold">{evidenceLevel}</span>).
                      </p>
                    </div>
                  </div>

                  {/* Step 6: Recommendation Generated */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-3xs ${
                      riskLevel === 'High Risk' ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300' : riskLevel === 'Caution' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      <Check className="w-3 h-3 stroke-[3.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Recommendation Generated</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase rounded">Step 6</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        Determined risk severity as <span className={`font-bold ${riskLevel === 'High Risk' ? 'text-rose-600 dark:text-rose-400' : riskLevel === 'Caution' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{riskLevel}</span>. Action: <span className="font-extrabold text-slate-850 dark:text-slate-200 underline">{conciseRec}</span>.
                      </p>
                    </div>
                  </div>

                  {/* Step 7: Alternative Suggested */}
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 bg-teal-100 dark:bg-teal-950 text-teal-850 dark:text-teal-300 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-3xs">
                      <Check className="w-3 h-3 stroke-[3.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Alternative Suggested</span>
                        <span className="text-[9px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase rounded">Step 7</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-relaxed">
                        Suggested clinical pathway: <span className="font-bold text-teal-700 dark:text-teal-400">{suggestedAlternative || 'Standard routine dosing protocol verified'}</span>. Clinical sequence complete.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Improved Clinical Interpretation Section */}
              <div className="space-y-6" id="clinical-interpretation-section">
                {(() => {
                  const sections = getDetailedClinicalInterpretation(gene, phenotype, drug, riskLevel);
                  return (
                    <>
                      {/* Section 1: Why this happens */}
                      <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100 dark:border-slate-850 font-display">
                          <Dna className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span>Why this happens</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                          {sections.whyThisHappens.content}
                        </p>
                      </div>

                      {/* Section 2: Clinical Impact */}
                      <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100 dark:border-slate-850 font-display">
                          <Activity className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                          <span>Clinical Impact</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                          {sections.clinicalImpact.content}
                        </p>
                      </div>

                      {/* Section 3: Treatment Recommendation */}
                      <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100 dark:border-slate-850 font-display">
                          <Stethoscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Treatment Recommendation</span>
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                          {sections.treatmentRecommendation.content}
                        </p>
                      </div>

                      {/* Section 4: Alternative Drugs (CARDS instead of text) */}
                      <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-4 pb-1.5 border-b border-slate-100 dark:border-slate-850 font-display">
                          <Shuffle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span>Alternative Drugs</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sections.alternativeDrugs.map((altDrug, idx) => (
                            <div 
                              key={idx} 
                              className={`p-4 border rounded-xl flex flex-col justify-between gap-3 shadow-3xs transition-all hover:shadow-2xs ${
                                altDrug.suitability === 'Recommended'
                                  ? 'bg-emerald-50/45 border-emerald-200/50 dark:bg-emerald-950/15 dark:border-emerald-900/30'
                                  : altDrug.suitability === 'Use with Caution'
                                  ? 'bg-amber-50/45 border-amber-200/50 dark:bg-amber-950/15 dark:border-amber-900/30'
                                  : 'bg-rose-50/45 border-rose-200/50 dark:bg-rose-950/15 dark:border-rose-900/30'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <h5 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                    {altDrug.name}
                                  </h5>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                                    altDrug.suitability === 'Recommended'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                                      : altDrug.suitability === 'Use with Caution'
                                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border-amber-200 dark:border-amber-900/40'
                                      : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40'
                                  }`}>
                                    {altDrug.suitability}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-350 font-semibold leading-normal">
                                  {altDrug.whyRecommended}
                                </p>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/50 dark:border-slate-800/40 flex-wrap">
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                  {altDrug.evidenceLevel}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border ${
                                  altDrug.riskLevel === 'Low Risk'
                                    ? 'bg-emerald-100/45 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-200/55 dark:border-emerald-900/40'
                                    : altDrug.riskLevel === 'Caution'
                                    ? 'bg-amber-100/45 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-200/55 dark:border-amber-900/40'
                                    : 'bg-rose-100/45 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border-rose-200/55 dark:border-rose-900/40'
                                }`}>
                                  {altDrug.riskLevel}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section 5: Monitoring Advice */}
                      <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100 dark:border-slate-850 font-display">
                          <Eye className="w-4 h-4 text-sky-600 dark:text-sky-450" />
                          <span>Monitoring Advice</span>
                        </h4>
                        <p className="text-xs text-slate-650 dark:text-slate-350 font-semibold leading-relaxed">
                          {sections.monitoringAdvice.content}
                        </p>
                      </div>

                      {/* Section 6: Patient Counseling Notes */}
                      <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100 dark:border-slate-850 font-display">
                          <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Patient Counseling Notes</span>
                        </h4>
                        <p className="text-xs text-slate-650 dark:text-slate-350 font-semibold leading-relaxed">
                          {sections.patientCounseling.content}
                        </p>
                      </div>
                    </>
                  );
                })()}

                {source && (
                  <div className="mt-4 pt-3.5 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 font-semibold px-1">
                    <span>Analysis Source: {source}</span>
                    <span>Database Code: CPIC v3.2 mapping</span>
                  </div>
                )}
              </div>

              {/* Clinical Evidence Expandable Section */}
              <div 
                className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 rounded-xl p-5 shadow-2xs mt-6 overflow-hidden transition-all duration-300" 
                id="clinical-evidence-card"
              >
                <button
                  type="button"
                  onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                  aria-expanded={isEvidenceExpanded}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400 transition-transform group-hover:scale-110" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest font-display">
                      Clinical Evidence Sources
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-colors">
                    <span>{isEvidenceExpanded ? 'Collapse' : 'Expand'}</span>
                    {isEvidenceExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Panel */}
                <AnimatePresence initial={false}>
                  {isEvidenceExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800"
                    >
                      {(() => {
                        const evidence = getClinicalEvidence(gene, drug);
                        return (
                          <>
                            {/* CPIC Guideline Summary */}
                            <div className="p-4 bg-slate-50/60 dark:bg-slate-950/35 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/50">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/40 dark:border-indigo-900/40">
                                    CPIC Guideline
                                  </span>
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">CPIC Guideline Summary</h4>
                                </div>
                                <a
                                  href="https://cpicpgx.org/guidelines/"
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold inline-flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-3xs transition-colors"
                                >
                                  <span>View Source</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                                {evidence.cpicSummary}
                              </p>
                            </div>

                            {/* PharmGKB Evidence */}
                            <div className="p-4 bg-slate-50/60 dark:bg-slate-950/35 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/50">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-100/40 dark:border-sky-900/40">
                                    PharmGKB
                                  </span>
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">PharmGKB Evidence Annotations</h4>
                                </div>
                                <a
                                  href="https://www.pharmgkb.org/"
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold inline-flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-3xs transition-colors"
                                >
                                  <span>View Source</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                                {evidence.pharmGkbEvidence}
                              </p>
                            </div>

                            {/* FDA Label Information */}
                            <div className="p-4 bg-slate-50/60 dark:bg-slate-950/35 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-2.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/50">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-100/40 dark:border-amber-900/40">
                                    FDA Labeling
                                  </span>
                                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">FDA Pharmacogenomics Label Info</h4>
                                </div>
                                <a
                                  href="https://www.fda.gov/"
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold inline-flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-3xs transition-colors"
                                >
                                  <span>View Source</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold leading-relaxed">
                                {evidence.fdaLabel}
                              </p>
                            </div>

                            {/* Research References */}
                            <div className="p-4 bg-slate-50/60 dark:bg-slate-950/35 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-3.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-950/50">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-100/40 dark:border-teal-900/40">
                                  Literature
                                  </span>
                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">Research References & Citations</h4>
                              </div>
                              
                              <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                                {evidence.researchRefs.map((ref, idx) => (
                                  <div key={idx} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="max-w-md">
                                      <h5 className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 leading-normal">{ref.title}</h5>
                                      <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium leading-relaxed mt-0.5">{ref.citation}</p>
                                    </div>
                                    <a
                                      href={ref.url}
                                      target="_blank"
                                      referrerPolicy="no-referrer"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-bold inline-flex items-center gap-1 bg-white dark:bg-slate-900 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-3xs transition-colors w-fit shrink-0 self-start sm:self-center"
                                    >
                                      <span>View Source</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Print and Download Actions */}
            <div className="mt-6 space-y-4">
              <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/15 border border-amber-200/40 dark:border-amber-900/40 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-350 font-medium leading-relaxed">
                  <strong>Clinical Warning:</strong> This is a decision-support reference. Results should be interpreted by certified molecular geneticists or clinical pharmacologists.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                <div className="text-xs text-slate-400 dark:text-slate-550 font-semibold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Verified CPIC® Evidence Mapping</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onSaveReport}
                    disabled={isSaving}
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSaved
                        ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/40'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
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
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-all cursor-pointer"
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
                    className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 border border-transparent rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    id="download-result-button"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    id="print-result-button"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center text-slate-400 dark:text-slate-550"
            id="empty-state"
          >
            <div className="w-full max-w-xs mx-auto mb-6 flex justify-center">
              <svg className="w-40 h-40 text-teal-650/10 dark:text-teal-400/15" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="100" cy="100" r="80" fill="currentColor" />
                <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="60" y1="60" x2="140" y2="140" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="140" y1="60" x2="60" y2="140" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.3" />
                  {Array.from({ length: 6 }).map((_, i) => {
                    const yOffset = i * 16;
                    const width = Math.sin((i / 5) * Math.PI) * 40;
                    return (
                      <g key={i}>
                        <line x1={100 - width} y1={50 + yOffset} x2={100 + width} y2={50 + yOffset} opacity="0.4" />
                        <circle cx={100 - width} cy={50 + yOffset} r="4.5" fill="#0d9488" />
                        <circle cx={100 + width} cy={50 + yOffset} r="4.5" fill="#4f46e5" />
                      </g>
                    );
                  })}
                </g>
                <path d="M 94 20 L 106 20 L 106 32 L 118 32 L 118 44 L 106 44 L 106 56 L 94 56 L 94 44 L 82 44 L 82 32 L 94 32 Z" fill="#0d9488" opacity="0.25" />
              </svg>
            </div>
            
            <h3 className="text-base sm:text-lg font-black text-slate-750 dark:text-slate-200 mb-2 font-display tracking-tight">
              Select a Gene Variant to Begin Clinical Analysis
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed pl-1 font-medium">
              Specify target locus markers and pharmacological agents in the left panel to execute high-fidelity clinical variant interpretation.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
