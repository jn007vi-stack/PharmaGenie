import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

// Setup paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import our local helper data
// Note: In tsx/development, relative imports work cleanly
import { getGuidelineInfo } from './src/data/guidelines';
import { GeneType, PhenotypeType } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client lazily or safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// API endpoint for generating pharmacogenomic explanations
app.post('/api/explain', async (req, res) => {
  try {
    const { gene, phenotype, drug, ageGroup } = req.body as {
      gene: GeneType;
      phenotype: PhenotypeType;
      drug: string;
      ageGroup?: string;
    };

    if (!gene || !phenotype || !drug) {
      return res.status(400).json({ error: 'Missing required parameters: gene, phenotype, and drug' });
    }

    const patientAgeGroup = ageGroup || 'Adult';

    // Look up established guidelines
    const guideline = getGuidelineInfo(gene, phenotype, drug);

    // Provide specific metabolic and clinical context based on the patient's age group
    let ageGroupContext = '';
    if (patientAgeGroup === 'Pediatric') {
      ageGroupContext = 'The patient is in the PEDIATRIC age group. Note that pediatric patients have developing hepatic enzymes and changing body weight. You MUST explain how the variant impacts metabolism in pediatric cohorts, and emphasize the critical need for weight-based calibration, precision dosing, or safer alternatives to avoid life-threatening pediatric toxicities.';
    } else if (patientAgeGroup === 'Geriatric') {
      ageGroupContext = 'The patient is in the GERIATRIC age group. Note that elderly patients typically suffer from reduced hepatic blood flow, lower renal clearance (decreased GFR), increased polypharmacy risks, and heightened receptor sensitivity. You MUST tailor the explanation to geriatric caution, advocating starting at lower doses ("start low and go slow") and monitoring for increased adverse reaction risks.';
    } else {
      ageGroupContext = 'The patient is an ADULT. Standard reference metabolic rates and standard clinical guideline dosing apply.';
    }

    // Prompt construction for clinical explanation
    const prompt = `You are an expert clinical pharmacogenomics reference assistant.
Analyze this clinical scenario:
- Selected Gene: ${gene}
- Patient Phenotype/Variant: ${phenotype}
- Patient Age Group: ${patientAgeGroup}
- Drug: ${drug}
- Clinical Guideline Reference: ${guideline.guidelineStatus}
- Expected Guideline Action/Context: ${guideline.defaultSummary}
- Evidence Level: ${guideline.evidenceLevel}

Age-Specific Metabolic Guidance:
${ageGroupContext}

Provide a high-quality, professional, non-alarming, patient-friendly response.
1. "explanation": A clear clinical interpretation of under 150 words explaining:
   - What the genetic variant means for this drug's metabolism (specifically how it affects enzyme activity).
   - How the metabolic impact is affected or compounded by the patient's age group (${patientAgeGroup}).
   - The practical impact/risks for the patient.
   - The recommended clinical action or dosing adjustment based on standard CPIC/PharmGKB guidelines.
   - You MUST end the explanation with EXACTLY this disclaimer sentence: "This is not a substitute for medical advice. Please confirm with a doctor or pharmacist before changing any medication."

2. "suggestedAlternative": 
   - If the risk level is Caution or High Risk, provide one short, clear sentence suggesting what type of alternative medication or clinical approach doctors typically consider in this situation (e.g. "Doctors often consider tramadol or NSAIDs as alternatives in this case").
   - If the risk level is Low Risk, this must be empty or blank.
   - If there is no established guideline or "Insufficient Data", this must be a statement that data is insufficient to suggest any alternative.

Return the response in JSON format.`;

    const client = getGeminiClient();

    if (client) {
      // Generate explanation using Gemini 3.5 Flash
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.1, // Keep it highly clinical and low-variance
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              explanation: { 
                type: 'STRING', 
                description: 'Under 150 words plain English clinical interpretation of variant metabolic impact, patient age group differences, practical consequences, and CPIC guideline action. Ends with medical disclaimer.' 
              },
              suggestedAlternative: { 
                type: 'STRING', 
                description: 'One short sentence suggesting what type of alternative medication or approach doctors typically consider if Caution or High Risk. Empty if Low Risk, or state insufficient data if No Established Guideline.' 
              }
            },
            required: ['explanation', 'suggestedAlternative']
          }
        }
      });

      let explanationText = '';
      let suggestedAlternativeText = guideline.suggestedAlternative || '';

      try {
        if (response.text) {
          const parsed = JSON.parse(response.text);
          explanationText = parsed.explanation || '';
          if (parsed.suggestedAlternative) {
            suggestedAlternativeText = parsed.suggestedAlternative;
          }
        }
      } catch (parseErr) {
        console.error('Error parsing structured JSON response from Gemini:', parseErr);
        explanationText = response.text || guideline.defaultSummary;
      }

      if (!explanationText) {
        explanationText = guideline.defaultSummary;
      }
      
      // Clean up final disclaimer to make sure it's present exactly once
      let cleanText = explanationText.trim();
      const disclaimer = "This is not a substitute for medical advice. Please confirm with a doctor or pharmacist before changing any medication.";
      
      // Ensure the text ends with the disclaimer
      if (!cleanText.includes(disclaimer)) {
        cleanText = `${cleanText}\n\n${disclaimer}`;
      }

      // If low risk, make sure suggestedAlternative is omitted/empty per rules
      if (guideline.riskLevel === 'Low Risk') {
        suggestedAlternativeText = '';
      }

      return res.json({
        gene,
        phenotype,
        drug,
        riskLevel: guideline.riskLevel,
        guidelineStatus: guideline.guidelineStatus,
        evidenceLevel: guideline.evidenceLevel,
        suggestedAlternative: suggestedAlternativeText,
        explanation: cleanText,
        source: 'Gemini AI Model (gemini-3.5-flash)'
      });
    } else {
      // API Key is not set or empty, fallback to rich offline clinical guideline summary
      console.log('Gemini API key not configured or empty. Using pre-cached medical guideline summaries.');
      
      let explanation = guideline.defaultSummary;
      if (patientAgeGroup === 'Pediatric') {
        explanation += `\n\n[Pediatric Note: Immature clearance/enzymes. Requires weight-based calibration and precision.]`;
      } else if (patientAgeGroup === 'Geriatric') {
        explanation += `\n\n[Geriatric Note: Reduced organ reserve and clearance rates. High risk of adverse events; start low and go slow.]`;
      }
      
      const disclaimer = "This is not a substitute for medical advice. Please confirm with a doctor or pharmacist before changing any medication.";
      if (!explanation.includes(disclaimer)) {
        explanation = `${explanation}\n\n${disclaimer}`;
      }

      return res.json({
        gene,
        phenotype,
        drug,
        riskLevel: guideline.riskLevel,
        guidelineStatus: guideline.guidelineStatus,
        evidenceLevel: guideline.evidenceLevel,
        suggestedAlternative: guideline.riskLevel === 'Low Risk' ? undefined : guideline.suggestedAlternative,
        explanation: explanation,
        source: 'Pre-cached Clinical Guidelines Database (Fallback Mode)'
      });
    }
  } catch (error: any) {
    console.error('Error generating explanation:', error);
    return res.status(500).json({ error: error.message || 'An error occurred during medical explanation generation' });
  }
});

// Configure Vite integration for dev server or static serving for production
const startServer = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in Development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving compiled static assets in Production mode.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PharmaGenie server listening on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start PharmaGenie server:', err);
});
