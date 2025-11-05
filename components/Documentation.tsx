
import React from 'react';
import BookOpenIcon from './icons/BookOpenIcon';
import CubeIcon from './icons/CubeIcon';
import UsersIcon from './icons/UsersIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import MagicWandIcon from './icons/MagicWandIcon';
import SparklesIcon from './icons/SparklesIcon';
import BeakerIcon from './icons/BeakerIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import FlaskIcon from './icons/FlaskIcon';
import ArrowsRightLeftIcon from './icons/ArrowsRightLeftIcon';
import PlayIcon from './icons/PlayIcon';
import CodeBracketIcon from './icons/CodeBracketIcon';
import HomeIcon from './icons/HomeIcon';
import MagnifyingGlassIcon from './icons/MagnifyingGlassIcon';
import WorkflowIcon from './icons/WorkflowIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';


const InteractiveModule: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    children: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => (
    <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
            <div className="bg-blue-500/20 p-4 rounded-lg text-blue-400 shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="text-2xl font-bold text-gray-50">{title}</h3>
                <p className="text-gray-400">{subtitle}</p>
            </div>
        </div>
        <div className="mt-6 pl-4 border-l-2 border-blue-500/30 space-y-4">
            {children}
        </div>
    </div>
);

const FeatureDetail: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
     <div className="flex items-start gap-4">
        <div className="text-teal-400 mt-1 shrink-0">{icon}</div>
        <div>
            <h4 className="font-semibold text-gray-50">{title}</h4>
            <p className="text-sm text-gray-300">{children}</p>
        </div>
    </div>
);


const SFLConcept: React.FC<{ icon: React.ReactNode; title: string; question: string; children: React.ReactNode; }> = ({ icon, title, question, children }) => (
    <div className="bg-gray-800 p-5 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-3 mb-2">
            {icon}
            <div>
                <h4 className="font-bold text-gray-50">{title}</h4>
                <p className="text-sm text-gray-400 italic">"{question}"</p>
            </div>
        </div>
        <p className="text-sm text-gray-300 pl-9">{children}</p>
    </div>
);


const Documentation: React.FC = () => {
    return (
        <div className="space-y-12">
            {/* Header */}
            <header className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700 text-center">
                <BookOpenIcon className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h1 className="text-4xl font-extrabold text-gray-50 mb-2">Welcome to SFL Prompt Studio</h1>
                <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                    This guide provides everything you need to know to harness the power of Systemic Functional Linguistics (SFL) for precise and effective AI prompt engineering.
                </p>
            </header>

            {/* SFL Concepts */}
            <section>
                <h2 className="text-3xl font-bold text-gray-50 mb-1 text-center">The SFL Framework</h2>
                <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">SFL helps you control AI output by defining the context of communication. By specifying the Field, Tenor, and Mode, you tell the AI exactly what to do, how to behave, and what structure to use.</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SFLConcept icon={<CubeIcon className="w-6 h-6 text-amber-400" />} title="Field" question="What is happening?">
                        Specifies the subject matter and knowledge domain. This tells the model <span className="font-semibold text-amber-400">what to talk about</span> (e.g., 'Quantum Physics', 'Python Programming').
                    </SFLConcept>
                    <SFLConcept icon={<UsersIcon className="w-6 h-6 text-violet-400" />} title="Tenor" question="Who is taking part?">
                        Defines the social roles and relationships. This tells the model <span className="font-semibold text-violet-400">how to behave</span> (e.g., 'Expert Persona', 'Friendly Tone').
                    </SFLConcept>
                    <SFLConcept icon={<DocumentTextIcon className="w-6 h-6 text-pink-400" />} title="Mode" question="What is language doing?">
                        Relates to the text's organization and format. This tells the model <span className="font-semibold text-pink-400">how to structure its response</span> (e.g., 'JSON format', 'Bulleted List').
                    </SFLConcept>
                </div>
            </section>

             {/* Core Concepts */}
            <section>
                <h2 className="text-3xl font-bold text-gray-50 mb-8 text-center">Core Concepts & Workflow</h2>
                <div className="space-y-8">
                    <InteractiveModule icon={<HomeIcon className="w-8 h-8"/>} title="The Dashboard: Your Command Center" subtitle="Organize, search, and test your entire prompt library.">
                        <FeatureDetail icon={<MagicWandIcon className="w-5 h-5"/>} title="AI-Powered Creation">
                            Use the Prompt Wizard to generate complete SFL prompts from a simple goal. Don't start from scratch; let the AI build your foundation.
                        </FeatureDetail>
                        <FeatureDetail icon={<MagnifyingGlassIcon className="w-5 h-5"/>} title="Instant Search & Filter">
                            Quickly find the exact prompt you need using powerful search and SFL-based filters like Task Type and AI Persona.
                        </FeatureDetail>
                         <FeatureDetail icon={<BeakerIcon className="w-5 h-5"/>} title="One-Click Testing">
                            Validate any prompt directly against Gemini to see its output and refine its performance without leaving your workflow.
                        </FeatureDetail>
                    </InteractiveModule>

                    <InteractiveModule icon={<FlaskIcon className="w-8 h-8"/>} title="The Lab: From Idea to Agent" subtitle="An integrated environment for real-time prompt refinement and multi-step workflow design.">
                        <FeatureDetail icon={<SparklesIcon className="w-5 h-5"/>} title="Ideation Studio">
                             Use live voice conversation with an AI assistant to refine SFL parameters in real-time. The assistant updates your prompt as you speak.
                        </FeatureDetail>
                        <FeatureDetail icon={<WorkflowIcon className="w-5 h-5"/>} title="Workflow Canvas">
                             Visually design complex agents by adding and connecting tasks. Chain together data inputs, SFL prompts, and custom logic to build powerful automations.
                        </FeatureDetail>
                         <FeatureDetail icon={<CodeBracketIcon className="w-5 h-5"/>} title="Data Store Inspector">
                             Examine the inputs and outputs of every task in your workflow to debug and understand the complete data flow from start to finish.
                        </FeatureDetail>
                    </InteractiveModule>

                     <InteractiveModule icon={<PlayIcon className="w-8 h-8"/>} title="Workflows: Automating Intelligence" subtitle="Chain tasks together to create sophisticated agents that automate complex processes.">
                        <FeatureDetail icon={<ArrowsRightLeftIcon className="w-5 h-5"/>} title="Task Chaining & Dependencies">
                            Define a precise execution order. The output of one task automatically becomes the input for the next, enabling complex data transformations.
                        </FeatureDetail>
                        <FeatureDetail icon={<DocumentTextIcon className="w-5 h-5"/>} title="Multi-Modal Input">
                            Workflows can accept text, images, and files as starting inputs, allowing you to build flexible agents for any kind of data.
                        </FeatureDetail>
                         <FeatureDetail icon={<ArrowDownTrayIcon className="w-5 h-5"/>} title="Share & Reuse">
                             Export your completed workflows as JSON files to share with your team or import them into other projects, promoting collaboration and reusability.
                        </FeatureDetail>
                    </InteractiveModule>
                </div>
            </section>
        </div>
    );
};

export default Documentation;
