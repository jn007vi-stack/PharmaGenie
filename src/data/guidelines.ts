import { GeneType, PhenotypeType, RiskLevel, GuidelineStatus, PresetCase } from '../types';

export const GENES: GeneType[] = [
  'CYP2D6',
  'CYP2C19',
  'CYP2C9',
  'CYP3A5',
  'VKORC1',
  'SLCO1B1',
  'TPMT',
  'DPYD'
];

export const PHENOTYPES: PhenotypeType[] = [
  'Normal Metabolizer',
  'Poor Metabolizer',
  'Intermediate Metabolizer',
  'Rapid Metabolizer',
  'Ultra-rapid Metabolizer'
];

export const DRUGS = [
  { name: 'Codeine', category: 'Analgesic' },
  { name: 'Clopidogrel', category: 'Antiplatelet' },
  { name: 'Fluorouracil', category: 'Oncology / Chemotherapy' },
  { name: 'Simvastatin', category: 'Statin / Lipid-lowering' },
  { name: 'Azathioprine', category: 'Immunosuppressant' },
  { name: 'Tramadol', category: 'Analgesic' },
  { name: 'Warfarin', category: 'Anticoagulant' },
  { name: 'Ibuprofen', category: 'NSAID' }
];

// Map of established gene-drug guidelines based on CPIC/PharmGKB style knowledge
export const ESTABLISHED_GUIDELINES: Record<string, Record<PhenotypeType, { riskLevel: RiskLevel; summary: string }>> = {
  // CYP2D6 & Codeine
  'CYP2D6-Codeine': {
    'Normal Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal conversion of codeine to active morphine. Standard age-appropriate dosing is recommended.'
    },
    'Poor Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Greatly reduced conversion of codeine to active morphine. Ineffective pain relief. Avoid codeine; select an alternative analgesic not metabolized by CYP2D6 (e.g., NSAID, or non-CYP2D6 opioid like morphine or fentanyl).'
    },
    'Intermediate Metabolizer': {
      riskLevel: 'Caution',
      summary: 'Reduced conversion to active morphine. May result in sub-optimal pain relief. Monitor therapy closely or consider alternative pain medications.'
    },
    'Rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal to slightly increased conversion to morphine. Standard dosing, monitor pain control and any potential side effects.'
    },
    'Ultra-rapid Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Rapid and extensive conversion of codeine to morphine. Risk of life-threatening morphine toxicity (e.g., respiratory depression). Codeine is strictly contraindicated. Avoid codeine; use alternative analgesics.'
    }
  },
  // CYP2D6 & Tramadol
  'CYP2D6-Tramadol': {
    'Normal Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal conversion of tramadol to its active analgesic metabolite. Standard dosing is indicated.'
    },
    'Poor Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Severely reduced pain relief due to low conversion into active metabolite. Avoid tramadol; select an alternative pain management strategy.'
    },
    'Intermediate Metabolizer': {
      riskLevel: 'Caution',
      summary: 'Reduced active metabolite formation. Pain control may be compromised. Closely monitor or choose an alternative.'
    },
    'Rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Standard conversion. Usual clinical dosing with standard monitoring is recommended.'
    },
    'Ultra-rapid Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Excessive conversion to active metabolite, posing high risks of opioid toxicity (dizziness, extreme sleepiness, respiratory depression). Tramadol is contraindicated. Avoid use; select alternative analgesics.'
    }
  },
  // CYP2C19 & Clopidogrel
  'CYP2C19-Clopidogrel': {
    'Normal Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal activation of clopidogrel. Standard antiplatelet response. Recommended standard dosing.'
    },
    'Poor Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Significantly reduced active clopidogrel metabolite level. Very high risk of cardiovascular events and stent thrombosis. Avoid clopidogrel; use alternative antiplatelet (e.g., prasugrel or ticagrelor) if no contraindications.'
    },
    'Intermediate Metabolizer': {
      riskLevel: 'Caution',
      summary: 'Moderately reduced active clopidogrel metabolite level, leading to suboptimal antiplatelet effect and increased cardiovascular risk. Avoid clopidogrel; use alternative antiplatelet (prasugrel, ticagrelor).'
    },
    'Rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal to high activation of clopidogrel. Standard antiplatelet efficacy. Standard dosing is recommended.'
    },
    'Ultra-rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal or increased activation. Standard antiplatelet efficacy with normal risk. Standard dosing is appropriate.'
    }
  },
  // DPYD & Fluorouracil
  'DPYD-Fluorouracil': {
    'Normal Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal clearance of fluorouracil. Standard clinical dosing is recommended.'
    },
    'Poor Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Severe or complete deficiency in DPYD activity. Extremely high risk of life-threatening systemic toxicity (severe myelosuppression, mucositis, neurotoxicity). Avoid fluorouracil entirely, or consider alternative chemotherapy.'
    },
    'Intermediate Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Partial DPYD enzyme deficiency. High risk of severe drug toxicity. CPIC recommends reducing starting dose by 50% or avoiding fluorouracil. Closely monitor patient and adjust dosage based on toxicity.'
    },
    'Rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal or high clearance of fluorouracil. Normal response or slightly lower efficacy. Standard dosing; monitor closely.'
    },
    'Ultra-rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Increased drug clearance. May result in reduced drug efficacy. Standard starting dose, with active dose titration based on clinical assessment.'
    }
  },
  // SLCO1B1 & Simvastatin
  'SLCO1B1-Simvastatin': {
    'Normal Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal SLCO1B1 transporter function. Standard risk of myopathy. Standard starting dose can be used.'
    },
    'Poor Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Significantly decreased SLCO1B1 transporter function leading to highly elevated simvastatin plasma levels. High risk of simvastatin-induced myopathy and rhabdomyolysis. Avoid simvastatin; use alternative statin (rosuvastatin, pravastatin).'
    },
    'Intermediate Metabolizer': {
      riskLevel: 'Caution',
      summary: 'Moderately decreased transporter function. Elevated simvastatin exposure, increasing risk of muscle toxicity. Limit simvastatin dosage (e.g. max 20mg/day) or use alternative statin.'
    },
    'Rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Standard or increased transporter activity. Low risk of myopathy. Standard dosing.'
    },
    'Ultra-rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal or high transporter activity. Low risk of muscle toxicity. Standard dosing.'
    }
  },
  // TPMT & Azathioprine
  'TPMT-Azathioprine': {
    'Normal Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal TPMT activity. Standard clearance of thiopurines. Standard starting dose can be used.'
    },
    'Poor Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Severely deficient TPMT activity. Extreme risk of life-threatening bone marrow suppression (myelosuppression). Reduce starting dose by 10-fold (90% reduction) and dose 3 times weekly, or choose alternative non-thiopurine therapy.'
    },
    'Intermediate Metabolizer': {
      riskLevel: 'Caution',
      summary: 'Moderate TPMT enzyme deficiency. Increased risk of myelosuppression with standard dose. Reduce starting dose by 30-50% and closely monitor blood counts.'
    },
    'Rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal thiopurine clearance. Standard starting dosage and routine monitoring.'
    },
    'Ultra-rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'High clearance. May require higher dosage or suffer reduced efficacy. Standard starting dose, monitor closely.'
    }
  },
  // CYP2C9 & Warfarin
  'CYP2C9-Warfarin': {
    'Normal Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal clearance of S-warfarin. Standard starting dose based on age, weight, and clinical variables.'
    },
    'Poor Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'Severely reduced S-warfarin clearance. High risk of excessive anticoagulation and bleeding. Consider a much lower starting dose (e.g., 50-70% dose reduction) and closely monitor INR.'
    },
    'Intermediate Metabolizer': {
      riskLevel: 'Caution',
      summary: 'Moderately decreased clearance of S-warfarin. Increased risk of bleeding. Recommend starting with a lower dose (e.g., 20-30% reduction) and closely monitoring INR.'
    },
    'Rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal warfarin metabolism. Standard dosing with regular INR monitoring.'
    },
    'Ultra-rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Rapid warfarin clearance. May require higher doses to reach therapeutic INR. Dose standard, monitor closely.'
    }
  },
  // VKORC1 & Warfarin
  'VKORC1-Warfarin': {
    'Normal Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Standard VKORC1 sensitivity (normal expression). Standard starting warfarin dose can be utilized.'
    },
    'Poor Metabolizer': {
      riskLevel: 'High Risk',
      summary: 'High warfarin sensitivity (low VKORC1 expression, AA genotype). Extremely high risk of bleeding on standard doses. Significant dose reduction (typically 50-70% lower starting dose) is required.'
    },
    'Intermediate Metabolizer': {
      riskLevel: 'Caution',
      summary: 'Moderate warfarin sensitivity (AG genotype). Increased risk of bleeding. Dose reduction (typically 20-30% lower starting dose) is recommended.'
    },
    'Rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Normal sensitivity. Standard clinical warfarin dosing and routine INR monitoring.'
    },
    'Ultra-rapid Metabolizer': {
      riskLevel: 'Low Risk',
      summary: 'Warfarin resistance (GG/other genotype). May require higher starting doses to achieve therapeutic anticoagulation.'
    }
  }
};

function getAlternativeSuggestion(gene: GeneType, drug: string, riskLevel: RiskLevel): string | undefined {
  if (riskLevel === 'Low Risk') return undefined;
  if (riskLevel === 'Insufficient Data') return 'Insufficient clinical evidence to suggest a pharmacogenomic alternative at this time.';
  
  const dName = drug.toLowerCase();
  if (gene === 'CYP2D6' && (dName.includes('codeine') || dName.includes('tramadol'))) {
    return 'Doctors often consider non-CYP2D6 opioids (e.g., morphine, fentanyl) or standard NSAIDs as alternatives in this case.';
  }
  if (gene === 'CYP2C19' && dName.includes('clopidogrel')) {
    return 'Doctors often consider alternative antiplatelets such as prasugrel or ticagrelor as alternatives in this case.';
  }
  if (gene === 'DPYD' && dName.includes('fluorouracil')) {
    return 'Doctors often consider alternative chemotherapy combinations or major dose reductions as alternatives in this case.';
  }
  if (gene === 'SLCO1B1' && dName.includes('simvastatin')) {
    return 'Doctors often consider alternative low-myopathy risk statins such as rosuvastatin or pravastatin as alternatives in this case.';
  }
  if (gene === 'TPMT' && dName.includes('azathioprine')) {
    return 'Doctors often consider non-thiopurine immunosuppressants or a standard 30-90% starting dose reduction as alternatives in this case.';
  }
  if ((gene === 'CYP2C9' || gene === 'VKORC1') && dName.includes('warfarin')) {
    return 'Doctors often consider non-vitamin K oral anticoagulants (NOACs/DOACs) or specialized dose reduction protocols as alternatives in this case.';
  }
  return `Doctors often consider alternative medications or precision dose reductions not dependent on ${gene} pathway in this case.`;
}

function getEvidenceLevel(gene: GeneType, drug: string): string {
  const key = `${gene}-${drug}`;
  const record = ESTABLISHED_GUIDELINES[key];
  if (!record) {
    return 'No Established Guideline';
  }
  if (gene === 'CYP3A5') {
    return 'Moderate Evidence (CPIC Level B)';
  }
  return 'Strong Evidence (CPIC Level A)';
}

// Returns guideline status and risk level for a given combination
export function getGuidelineInfo(
  gene: GeneType,
  phenotype: PhenotypeType,
  drug: string
): { 
  riskLevel: RiskLevel; 
  guidelineStatus: GuidelineStatus; 
  evidenceLevel: string;
  suggestedAlternative?: string;
  defaultSummary: string;
} {
  const key = `${gene}-${drug}`;
  const record = ESTABLISHED_GUIDELINES[key];

  if (record && record[phenotype]) {
    const info = record[phenotype];
    const ev = getEvidenceLevel(gene, drug);
    const alt = getAlternativeSuggestion(gene, drug, info.riskLevel);
    return {
      riskLevel: info.riskLevel,
      guidelineStatus: 'CPIC/PharmGKB Guideline Exists',
      evidenceLevel: ev,
      suggestedAlternative: alt,
      defaultSummary: info.summary
    };
  }

  const ev = getEvidenceLevel(gene, drug);
  const alt = getAlternativeSuggestion(gene, drug, 'Insufficient Data');
  return {
    riskLevel: 'Insufficient Data',
    guidelineStatus: 'No Established Guideline',
    evidenceLevel: ev,
    suggestedAlternative: alt,
    defaultSummary: `No CPIC or PharmGKB clinical guidelines exist mapping the relationship between gene ${gene} (${phenotype}) and drug ${drug}. There is currently insufficient evidence to suggest that this genetic variant affects the pharmacokinetics, pharmacodynamics, or clinical safety profile of this medication.`
  };
}

// 4 Preset Demo Cases
export const PRESET_CASES: PresetCase[] = [
  {
    id: 'c1',
    title: 'CYP2D6 – Codeine',
    gene: 'CYP2D6',
    phenotype: 'Poor Metabolizer',
    drug: 'Codeine',
    description: 'Patient reports no pain relief after standard codeine dosage. Investigate variant effect.'
  },
  {
    id: 'c2',
    title: 'CYP2C19 – Clopidogrel',
    gene: 'CYP2C19',
    phenotype: 'Intermediate Metabolizer',
    drug: 'Clopidogrel',
    description: 'Post-PCI patient prescribed Clopidogrel. Assess risk of adverse stent events.'
  },
  {
    id: 'c3',
    title: 'DPYD – Fluorouracil',
    gene: 'DPYD',
    phenotype: 'Poor Metabolizer',
    drug: 'Fluorouracil',
    description: 'Patient scheduled for colorectal cancer treatment. Screen for life-threatening toxicities.'
  },
  {
    id: 'c4',
    title: 'CYP2D6 – Ibuprofen',
    gene: 'CYP2D6',
    phenotype: 'Normal Metabolizer',
    drug: 'Ibuprofen',
    description: 'Demo of a combination with no established FDA or CPIC pharmacogenomic guideline.'
  }
];
