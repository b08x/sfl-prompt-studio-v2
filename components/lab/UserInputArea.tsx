
import React, { useState } from 'react';
import { StagedUserInput } from '../../types';
import PaperClipIcon from '../icons/PaperClipIcon';
import DocumentTextIcon from '../icons/DocumentTextIcon';
import PhotoIcon from '../icons/PhotoIcon';
import CheckIcon from '../icons/CheckIcon';
import XCircleIcon from '../icons/XCircleIcon';

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
        if(uploadedFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFile({ name: uploadedFile.name, content: event.target?.result as string });
            };
            reader.readAsText(uploadedFile);
        }
    }

    const handleStage = () => {
        if (isStaged) return;

        const inputToStage: StagedUserInput = {};
        if (text) inputToStage.text = text;
        if (image) inputToStage.image = { name: image.name, type: image.type, base64: image.base64 };
        if (file) inputToStage.file = file;
        
        onStageInput(inputToStage);
        setIsStaged(true);

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
            className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                activeTab === tabId
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-col bg-gray-800 border border-gray-700 rounded-lg">
            <div className="px-4 pt-3 border-b border-gray-700">
                <nav className="-mb-px flex space-x-2">
                    <TabButton tabId="text"><DocumentTextIcon className="w-5 h-5"/><span>Text</span></TabButton>
                    <TabButton tabId="image"><PhotoIcon className="w-5 h-5"/><span>Image</span></TabButton>
                    <TabButton tabId="file"><PaperClipIcon className="w-5 h-5"/><span>File</span></TabButton>
                </nav>
            </div>
            <div className="p-4 flex-grow min-h-[250px]">
                {activeTab === 'text' && (
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste article text or describe the issue..."
                        className="w-full h-full p-2 border border-gray-600 bg-gray-900 text-gray-50 rounded-md resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                )}
                {activeTab === 'image' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        {image ? (
                            <div className="text-center relative group">
                                <img src={image.preview} alt={image.name} className="max-h-48 rounded-md border border-gray-600" />
                                <p className="text-xs mt-2 text-gray-300 truncate">{image.name}</p>
                                <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 p-1 bg-gray-800 rounded-full text-red-400 hover:text-red-300 opacity-50 group-hover:opacity-100 transition-opacity" title="Remove image">
                                    <XCircleIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ) : (
                            <label htmlFor="image-upload" className="cursor-pointer p-6 border-2 border-dashed border-gray-600 rounded-md text-center hover:bg-gray-700/50 w-full">
                                <PhotoIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                <span className="text-sm text-gray-400">Click to upload image</span>
                            </label>
                        )}
                    </div>
                )}
                 {activeTab === 'file' && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <input type="file" id="file-upload" className="hidden" accept=".txt,.md,.text,.json,.csv" onChange={handleFileUpload} />
                        {file ? (
                            <div className="text-center relative group">
                                <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-500"/>
                                <p className="text-sm mt-2 text-gray-200">{file.name}</p>
                                <button onClick={() => setFile(null)} className="absolute -top-2 -right-2 p-1 bg-gray-800 rounded-full text-red-400 hover:text-red-300 opacity-50 group-hover:opacity-100 transition-opacity" title="Remove file">
                                    <XCircleIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ) : (
                             <label htmlFor="file-upload" className="cursor-pointer p-6 border-2 border-dashed border-gray-600 rounded-md text-center hover:bg-gray-700/50 w-full">
                                <PaperClipIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                <span className="text-sm text-gray-400">Click to upload text file</span>
                            </label>
                        )}
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-gray-700">
                <button
                    onClick={handleStage}
                    disabled={isStaged}
                    className={`w-full py-2 rounded-md font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                        isStaged
                            ? 'bg-teal-500 text-white cursor-default'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                    {isStaged ? (
                        <>
                            <CheckIcon className="w-5 h-5" />
                            <span>Input Staged for Workflow</span>
                        </>
                    ) : (
                        <span>Stage Input</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default UserInputArea;
