
import { PromptSFL } from '../types';

export type ValidationResult = {
  type: 'warning' | 'error';
  message: string;
};

export const validateSFL = (prompt: PromptSFL): ValidationResult[] => {
  const issues: ValidationResult[] = [];
  const { sflField, sflTenor, sflMode } = prompt;

  // Rule 1: Length vs. Tone
  const shortLengths = ["Single Sentence", "Short Paragraph (~50 words)"];
  const longLengths = ["Long Paragraph (~300 words)", "Multiple Paragraphs (~500+ words)"];
  if (shortLengths.includes(sflMode.lengthConstraint) && sflTenor.desiredTone === "Detailed") {
    issues.push({
      type: 'warning',
      message: `A "Detailed" tone may conflict with a short length constraint ("${sflMode.lengthConstraint}"). The AI might struggle to be detailed in such a small space.`
    });
  }
  if (longLengths.includes(sflMode.lengthConstraint) && sflTenor.desiredTone === "Concise") {
    issues.push({
      type: 'warning',
      message: `A "Concise" tone may conflict with a long length constraint ("${sflMode.lengthConstraint}"). The result might be less dense than expected.`
    });
  }

  // Rule 2: Audience vs. Persona
  const technicalPersonas = ["Expert", "Devil's Advocate", "Historian", "Philosopher"];
  if (sflTenor.targetAudience.includes("Children (5-7 years)") && technicalPersonas.includes(sflTenor.aiPersona)) {
    issues.push({
      type: 'warning',
      message: `The AI persona "${sflTenor.aiPersona}" may use complex language that is unsuitable for the target audience "Children (5-7 years)".`
    });
  }

  // Rule 3: Format vs. Task
  const codeFormats = ["Python Code", "JavaScript Code", "JSON", "XML", "HTML"];
  const creativeFormats = ["Poem", "Short Story"];
  
  if (sflField.taskType === "Code Generation" && creativeFormats.includes(sflMode.outputFormat)) {
      issues.push({
          type: 'warning',
          message: `The task "Code Generation" is likely incompatible with a creative output format like "${sflMode.outputFormat}".`
      });
  }
  
  if (["Summarization", "Explanation", "Translation"].includes(sflField.taskType) && codeFormats.includes(sflMode.outputFormat)) {
      issues.push({
          type: 'warning',
          message: `The task "${sflField.taskType}" may not produce a valid output in a strict data format like "${sflMode.outputFormat}" unless specifically instructed in the prompt text.`
      });
  }

  // Rule 4: Structure vs. Length
  const complexStructures = ['conclusion', 'points', 'sections', 'chapters', 'introduction'];
  if (sflMode.lengthConstraint === "Single Sentence" && sflMode.rhetoricalStructure && complexStructures.some(keyword => sflMode.rhetoricalStructure.toLowerCase().includes(keyword))) {
      issues.push({
          type: 'warning',
          message: `A complex rhetorical structure ("${sflMode.rhetoricalStructure}") is unlikely to fit within a "Single Sentence" length constraint.`
      });
  }

  // Rule 5: Directives vs. Audience
  if (sflTenor.targetAudience.includes("Experts") && sflMode.textualDirectives && sflMode.textualDirectives.toLowerCase().includes("avoid jargon")) {
      issues.push({
          type: 'warning',
          message: `The directive "Avoid jargon" might be counterproductive when targeting an "Expert" audience who may expect technical terms.`
      });
  }

  return issues;
};
