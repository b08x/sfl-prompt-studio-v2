import React from 'react';
import ModalShell from './ModalShell';

const HelpSection: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
    <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-50">{title}</h3>
        <p className="text-md text-gray-400 mb-3 italic">"{subtitle}"</p>
        <div className="space-y-4 text-gray-200 text-sm leading-relaxed pl-4 border-l-2 border-gray-700">
            {children}
        </div>
    </div>
);

const DetailBlock: React.FC<{ term: string; definition: string; algo: string }> = ({ term, definition, algo }) => (
    <div>
        <h4 className="font-semibold text-gray-50 text-base">{term}</h4>
        <p className="mb-1">{definition}</p>
        <div className="bg-gray-900 p-3 rounded-md border border-gray-700">
            <p className="font-mono text-xs text-gray-300"><span className="font-semibold text-blue-400">Algorithmic Representation:</span> {algo}</p>
        </div>
    </div>
);

const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title="SFL Prompt Engineering Guide" size="4xl">
            <div className="prose-dark max-w-none text-gray-200">
                <p className="text-md mb-6 border-b border-gray-700 pb-4">
                    Systemic Functional Linguistics (SFL) provides a powerful framework for engineering prompts. By systematically defining the context of communication, you gain precise control over the AI's generation process. This guide explains each SFL parameter in terms of its effect on the AI model's behavior.
                </p>

                <HelpSection title="Field (Ideational Metafunction)" subtitle="What is happening?">
                    <p>
                        'Field' specifies the subject matter and the nature of the activity. For an AI, this sets the knowledge domain and the type of process it should execute. It tells the model what to talk about.
                    </p>
                    <DetailBlock
                        term="Topic"
                        definition="The high-level subject area of the prompt."
                        algo="Directly maps to high-dimensional vector spaces where related concepts are clustered. Providing a 'Topic' primes the model's attention mechanism to focus on specific sub-regions of its knowledge graph (e.g., 'Astrophysics' activates neurons associated with space, physics, stars)."
                    />
                    <DetailBlock
                        term="Task Type"
                        definition="The specific action the AI should perform with the information."
                        algo="Configures the model's internal 'mode of operation'. 'Code Generation' activates different sequence-to-sequence pathways than 'Creative Writing'. This parameter influences the choice of syntax, logical flow, and token generation patterns. For example, 'Summarization' prioritizes information compression, while 'Explanation' prioritizes building logical connections and using analogies."
                    />
                    <DetailBlock
                        term="Domain Specifics"
                        definition="Fine-grained contextual details, constraints, or specific sub-fields."
                        algo="Acts as a powerful filter within the activated 'Topic' vector space. It constrains the model's vocabulary and factual recall. 'Python 3.9, pandas' instructs the model to use the syntax and library functions specific to that environment, avoiding anachronisms or irrelevant libraries."
                    />
                    <DetailBlock
                        term="Keywords"
                        definition="Explicit terms that must be included or are central to the response."
                        algo="Act as explicit 'attention magnets'. Each keyword strongly biases the model to include or relate to the concept represented by that keyword's embedding. It's a direct way to ensure certain concepts are present in the output, guiding token selection at multiple points during generation."
                    />
                </HelpSection>

                <HelpSection title="Tenor (Interpersonal Metafunction)" subtitle="Who is taking part?">
                     <p>
                        'Tenor' defines the social roles and relationships between the participants. For an AI, this dictates its persona, the assumed knowledge of the audience, and the desired social tone. It tells the model how to behave.
                    </p>
                    <DetailBlock
                        term="AI Persona"
                        definition="The character or role the AI should adopt."
                        algo="Loads a 'behavioral model' or 'character' from the AI's training data. The persona 'Sarcastic Bot' will apply a filter to its word choices, favoring tokens associated with irony and wit. 'Expert' will increase the probability of using technical jargon and a formal sentence structure. It's a high-level instruction that conditions the entire generation process."
                    />
                     <DetailBlock
                        term="Target Audience"
                        definition="The intended recipient of the AI's response."
                        algo="Adjusts the model's 'complexity dial'. It directly influences vocabulary choice and sentence structure. 'Experts' allows for dense, technical language. 'Children' forces the model to select simpler words, use shorter sentences, and rely on concrete examples, effectively pruning the search space of possible next tokens."
                    />
                    <DetailBlock
                        term="Desired Tone"
                        definition="The emotional and stylistic attitude of the response."
                        algo="Modifies the emotional and stylistic valence of the generated text. 'Formal' will up-weight tokens and grammatical structures associated with academic writing. 'Humorous' will activate pathways related to wordplay and irony. It's a fine-tuning parameter applied over the persona and content."
                    />
                    <DetailBlock
                        term="Interpersonal Stance"
                        definition="The social relationship and power dynamic between the AI and the user."
                        algo="Defines the pragmatic function of the language. 'Act as a mentor' biases the model to be encouraging and provide guidance. 'Be a collaborative partner' encourages more tentative language and suggestions, influencing turn-taking and politeness strategies in the model's output."
                    />
                </HelpSection>
                
                <HelpSection title="Mode (Textual Metafunction)" subtitle="What role is language playing?">
                     <p>
                        'Mode' relates to how the text is organized and its function in the context. For an AI, this is about the channel, structure, and format of the output. It tells the model how to structure the text.
                    </p>
                    <DetailBlock
                        term="Output Format"
                        definition="The required syntactical structure of the output (e.g., JSON, Markdown)."
                        algo={`A hard constraint on the output's structure. 'JSON' forces the model's generation to be heavily constrained by a finite state machine representing JSON syntax. This dramatically alters token probabilities to fit the required structure (e.g., high probability of a '"' after a '{'). It is a powerful structural control.`}
                    />
                    <DetailBlock
                        term="Rhetorical Structure"
                        definition="The high-level organizational pattern of the text."
                        algo="Provides a 'scaffold' or 'template' for the text. 'Problem-Solution' instructs the model to generate text in two distinct parts, guiding the discourse structure and ensuring a logical flow from one part to the next. The model plans its output to fit this narrative arc."
                    />
                    <DetailBlock
                        term="Length Constraint"
                        definition="The desired length of the response."
                        algo="Directly influences the model's internal stopping criteria. 'Short Paragraph (~50 words)' sets a target token count. The model will try to generate a coherent thought within that limit, adjusting its level of detail to fit. It's a 'soft' guide for composition, distinct from a hard API token limit."
                    />
                    <DetailBlock
                        term="Textual Directives"
                        definition="Specific, micro-level rules about style or grammar."
                        algo="These are fine-grained filters on the final token selection. 'Use active voice' will down-weight the probability of generating passive constructions (e.g., 'was done by'). 'Avoid jargon' acts as a negative constraint, telling the model to avoid specific tokens or classes of tokens."
                    />
                </HelpSection>
            </div>
             <div className="flex justify-end pt-4 mt-6 border-t border-gray-700">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                >
                    Close
                </button>
            </div>
        </ModalShell>
    );
};

export default HelpModal;