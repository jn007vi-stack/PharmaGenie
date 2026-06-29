export type GeneType = 'CYP2D6' | 'CYP2C19' | 'CYP2C9' | 'CYP3A5' | 'VKORC1' | 'SLCO1B1' | 'TPMT' | 'DPYD';

export type AgeGroupType = 'Pediatric' | 'Adult' | 'Geriatric';

export type PhenotypeType = 
  | 'Normal Metabolizer' 
  | 'Poor Metabolizer' 
  | 'Intermediate Metabolizer' 
  | 'Rapid Metabolizer' 
  | 'Ultra-rapid Metabolizer';

export type RiskLevel = 'Low Risk' | 'Caution' | 'High Risk' | 'Insufficient Data';

export type GuidelineStatus = 'CPIC/PharmGKB Guideline Exists' | 'No Established Guideline';

export interface GuidelineDefinition {
  gene: GeneType;
  drug: string;
  phenotypeRisk: Record<PhenotypeType, {
    riskLevel: RiskLevel;
    guidelineStatus: GuidelineStatus;
    shortSummary: string;
  }>;
}

export interface PresetCase {
  id: string;
  title: string;
  gene: GeneType;
  phenotype: PhenotypeType;
  drug: string;
  description: string;
}

export interface ClinicalExplanationResponse {
  gene: GeneType;
  phenotype: PhenotypeType;
  drug: string;
  riskLevel: RiskLevel;
  guidelineStatus: GuidelineStatus;
  evidenceLevel: string;
  suggestedAlternative?: string;
  explanation: string;
}
