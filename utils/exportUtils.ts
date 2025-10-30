import { PromptSFL } from '../types';

export const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-z0-9_\-\s]/gi, '_').replace(/\s+/g, '_');
};

export const promptToMarkdown = (prompt: PromptSFL): string => {
    const { 
        title, updatedAt, promptText, sflField, sflTenor, sflMode, exampleOutput, notes, sourceDocument
    } = prompt;

    const sections = [
        `# ${title || 'Untitled Prompt'}`,
        `**Last Updated:** ${new Date(updatedAt).toLocaleString()}`,
        '---',
        '## Prompt Text',
        '```',
        promptText || '',
        '```',
    ];

    if (sourceDocument) {
        sections.push(
            '---',
            '## Source Document',
            `**Filename:** \`${sourceDocument.name}\``,
            '> This document was used as a stylistic reference during prompt generation.',
            '',
            '<details>',
            '<summary>View Content</summary>',
            '',
            '```',
            sourceDocument.content,
            '```',
            '</details>'
        );
    }

    sections.push(
        '---',
        '## SFL Metadata',
        '### Field (What is happening?)',
        `- **Topic:** ${sflField.topic || 'N/A'}`,
        `- **Task Type:** ${sflField.taskType || 'N/A'}`,
        `- **Domain Specifics:** ${sflField.domainSpecifics || 'N/A'}`,
        `- **Keywords:** ${sflField.keywords ? `\`${sflField.keywords.split(',').map(k => k.trim()).join('`, `')}\`` : 'N/A'}`,
        '',
        '### Tenor (Who is taking part?)',
        `- **AI Persona:** ${sflTenor.aiPersona || 'N/A'}`,
        `- **Target Audience:** ${sflTenor.targetAudience.join(', ') || 'N/A'}`,
        `- **Desired Tone:** ${sflTenor.desiredTone || 'N/A'}`,
        `- **Interpersonal Stance:** ${sflTenor.interpersonalStance || 'N/A'}`,
        '',
        '### Mode (What role is language playing?)',
        `- **Output Format:** ${sflMode.outputFormat || 'N/A'}`,
        `- **Rhetorical Structure:** ${sflMode.rhetoricalStructure || 'N/A'}`,
        `- **Length Constraint:** ${sflMode.lengthConstraint || 'N/A'}`,
        `- **Textual Directives:** ${sflMode.textualDirectives || 'N/A'}`,
    );

    if (exampleOutput) {
        sections.push(
            '---',
            '## Example Output',
            '```',
            exampleOutput,
            '```'
        );
    }

    if (notes) {
        sections.push(
            '---',
            '## Notes',
            notes
        );
    }
    
    return sections.join('\n');
};
