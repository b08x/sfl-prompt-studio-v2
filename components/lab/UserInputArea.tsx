import React, { useState } from 'react';
import { StagedUserInput } from '../../types';
import PaperClipIcon from '../icons/PaperClipIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import CheckIcon from '../icons/CheckIcon';

type Tab = 'text' | 'image' | 'file';

const UserInputArea: React.FC<{ onStageInput: (input: StagedUserInput) => void }> = ({ onStageInput }) => {
    const [activeTab, setActiveTab] = useState<Tab>('text');
    const [text, setText] = useState('');
    const [image, setImage] = useState<{ name: string; type: string; base64: string, preview: string } | null>(null);
    const [file, setFile] = useState<{ name: string; content: string } | null>(null);
    const [isStaged, setIsStaged] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if (uploadedFile && uploadedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = (event.target?.result as string).split(',')[1];
                const preview = URL.createObjectURL(uploadedFile);
                setImage({ name: uploadedFile.name, type: uploadedFile.type, base64, preview });
            };
            reader.readAsDataURL(uploadedFile);
        }
    };
    
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = e.target.files?.[0];
        if(uploadedFile && (uploadedFile.type.startsWith('text/') || uploadedFile.name.endsWith('.md'))) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFile({ name: uploadedFile.name, content: event.target?.result as string });
            };
            reader.readAsText(uploadedFile);
        }
    }

    const handleStage = () => {
        if (isStaged) return; // Prevent multiple clicks

        onStageInput({ text, image, file });
        setIsStaged(true);

        // Clear inputs
        setText('');
        setImage(null);
        setFile(null);
        
        setTimeout(() => {
            setIsStaged(false);
        }, 2000);
    };

    const TabButton: React.FC<{ tabId: Tab, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 ${
                activeTab === tabId
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex-grow flex flex-col p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h2 className="text-lg font-bold text-gray-50 mb-2">User Input</h2>
            <div className="border-b border-gray-700 -mx-4 px-4">
                <nav className="-mb-px flex space-x-4">
                    <TabButton tabId="text">Text</TabButton>
                    <TabButton tabId="image">Image</TabButton>
                    <TabButton tabId="file">File</TabButton>
                </nav>
            </div>
            <div className="flex-grow pt-4">
                {activeTab === 'text' && (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste article text or other content here..."
                        className="w-full h-full p-2 border border-gray-600 bg-gray-800 text-gray-50 rounded-md resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                )}
                {activeTab === 'image' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        {image ? (
                            <div className="text-center">
                                <img src={image.preview} alt={image.name} className="max-h-40 rounded-md border border-gray-600" />
                                <p className="text-xs mt-2 text-gray-300 truncate">{image.name}</p>
                                <button onClick={() => setImage(null)} className="text-xs text-red-400 mt-1">Remove</button>
                            </div>
                        ) : (
                            <label htmlFor="image-upload" className="cursor-pointer p-6 border-2 border-dashed border-gray-600 rounded-md text-center hover:bg-gray-800">
                                <PaperClipIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                <span className="text-sm text-gray-400">Click to upload image</span>
                            </label>
                        )}
                    </div>
                )}
                 {activeTab === 'file' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <input type="file" id="file-upload" className="hidden" accept=".txt,.md,.text" onChange={handleFileUpload} />
                        {file ? (
                            <div className="text-center">
                                <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-500"/>
                                <p className="text-sm mt-2 text-gray-200">{file.name}</p>
                                <button onClick={() => setFile(null)} className="text-xs text-red-400 mt-1">Remove</button>
                            </div>
                        ) : (
                             <label htmlFor="file-upload" className="cursor-pointer p-6 border-2 border-dashed border-gray-600 rounded-md text-center hover:bg-gray-800">
                                <PaperClipIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                <span className="text-sm text-gray-400">Click to upload text file</span>
                            </label>
                        )}
                    </div>
                )}
            </div>
            <button
                onClick={handleStage}
                disabled={isStaged}
                className={`w-full mt-4 py-2 rounded-md font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                    isStaged
                        ? 'bg-teal-500 text-white cursor-default'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
            >
                {isStaged ? (
                    <>
                        <CheckIcon className="w-5 h-5" />
                        <span>Input Staged</span>
                    </>
                ) : (
                    <span>Stage Input for Workflow</span>
                )}
            </button>
        </div>
    );
};

export default UserInputArea;