
import React, { useState, useEffect } from 'react';
import { StagedUserInput, Task } from '../../../types';
import PaperClipIcon from '../../icons/PaperClipIcon';
import DocumentTextIcon from '../../icons/DocumentTextIcon';
import ModalShell from '../../ModalShell';

type Tab = 'text' | 'image' | 'file';

interface UserInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStageInput: (input: StagedUserInput) => void;
    task: Task;
}

const UserInputModal: React.FC<UserInputModalProps> = ({ isOpen, onClose, onStageInput, task }) => {
    // Determine which tabs are relevant based on the task's input keys
    const relevantTabs: Tab[] = [];
    if (task.inputKeys.some(k => k.includes('text'))) relevantTabs.push('text');
    if (task.inputKeys.some(k => k.includes('image'))) relevantTabs.push('image');
    if (task.inputKeys.some(k => k.includes('file'))) relevantTabs.push('file');

    const [activeTab, setActiveTab] = useState<Tab>('text');
    
    useEffect(() => {
        // Set the initial active tab when the modal opens
        if(isOpen) {
            setActiveTab(relevantTabs[0] || 'text');
        }
    }, [isOpen, task.id]);


    const [text, setText] = useState('');
    const [image, setImage] = useState<{ name: string; type: string; base64: string, preview: string } | null>(null);
    const [file, setFile] = useState<{ name: string; content: string } | null>(null);

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
        onStageInput({
            text: text || undefined,
            image: image ? { name: image.name, type: image.type, base64: image.base64 } : undefined,
            file: file || undefined,
        });
        // Reset local state and close
        setText('');
        setImage(null);
        setFile(null);
        onClose();
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
        <ModalShell isOpen={isOpen} onClose={onClose} title={`Provide Input for: ${task.name}`} size="lg">
            <div className="flex flex-col h-[60vh]">
                 {relevantTabs.length > 1 && (
                     <div className="border-b border-gray-700">
                        <nav className="-mb-px flex space-x-4">
                           {relevantTabs.includes('text') && <TabButton tabId="text">Text</TabButton>}
                           {relevantTabs.includes('image') && <TabButton tabId="image">Image</TabButton>}
                           {relevantTabs.includes('file') && <TabButton tabId="file">File</TabButton>}
                        </nav>
                    </div>
                 )}
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
                                    <img src={image.preview} alt={image.name} className="max-h-64 rounded-md border border-gray-600" />
                                    <p className="text-xs mt-2 text-gray-300 truncate">{image.name}</p>
                                    <button onClick={() => setImage(null)} className="text-xs text-red-400 mt-1">Remove</button>
                                </div>
                            ) : (
                                <label htmlFor="image-upload" className="cursor-pointer p-6 border-2 border-dashed border-gray-600 rounded-md text-center hover:bg-gray-800 w-full h-full flex flex-col items-center justify-center">
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
                                 <label htmlFor="file-upload" className="cursor-pointer p-6 border-2 border-dashed border-gray-600 rounded-md text-center hover:bg-gray-800 w-full h-full flex flex-col items-center justify-center">
                                    <PaperClipIcon className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                                    <span className="text-sm text-gray-400">Click to upload text file</span>
                                </label>
                            )}
                        </div>
                    )}
                </div>
                 <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600">Cancel</button>
                    <button
                        onClick={handleStage}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                    >
                        Stage Input
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};

export default UserInputModal;
