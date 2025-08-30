

import React, { useState, useEffect, useMemo } from 'react';
import { StagedUserInput, Task } from '../../../types';
import ModalShell from '../../ModalShell';
import DocumentTextIcon from '../../icons/DocumentTextIcon';
import PhotoIcon from '../../icons/PhotoIcon';
import VideoCameraIcon from '../../icons/VideoCameraIcon';
import XCircleIcon from '../../icons/XCircleIcon';

type Tab = 'text' | 'image' | 'file' | 'video';

interface UserInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStageInput: (input: StagedUserInput) => void;
    task: Task;
}

const TABS_CONFIG: Record<Tab, { icon: React.FC<any>, label: string, disabled?: boolean, tooltip?: string }> = {
    text: { icon: DocumentTextIcon, label: "Text" },
    image: { icon: PhotoIcon, label: "Image" },
    file: { icon: DocumentTextIcon, label: "File" },
    video: { icon: VideoCameraIcon, label: "Video", disabled: true, tooltip: "Video uploads coming soon!" },
};


const UploadZone: React.FC<{
    id: string;
    icon: React.ReactNode;
    message: string;
    accept: string;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isDragging: boolean;
}> = ({ id, icon, message, accept, onUpload, isDragging }) => (
    <>
        <input type="file" id={id} className="hidden" accept={accept} onChange={onUpload} />
        <label htmlFor={id} className={`cursor-pointer p-6 border-2 border-dashed rounded-lg text-center w-full h-full flex flex-col items-center justify-center transition-all duration-200
            ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-105' : 'border-gray-600 hover:bg-gray-700/50 hover:border-gray-500'}`}>
            {icon}
            <span className={`mt-2 text-sm font-medium ${isDragging ? 'text-blue-300' : 'text-gray-400'}`}>{isDragging ? 'Drop it here!' : message}</span>
            <span className={`mt-1 text-xs ${isDragging ? 'text-blue-400' : 'text-gray-500'}`}>or drag and drop</span>
        </label>
    </>
);

const UserInputModal: React.FC<UserInputModalProps> = ({ isOpen, onClose, onStageInput, task }) => {
    // FIX: Explicitly define the return type of useMemo as Tab[] to prevent type inference widening to string[].
    const relevantTabs = useMemo((): Tab[] => {
        const tabs: Tab[] = [];
        if (!task || !task.inputKeys) {
            return ['text', 'image', 'file']; // Default if task is somehow invalid
        }
        const acceptsText = task.inputKeys.some(k => k.includes('text'));
        const acceptsFile = task.inputKeys.some(k => k.includes('file'));
        const acceptsImage = task.inputKeys.some(k => k.includes('image'));

        if (acceptsText || acceptsFile) {
            tabs.push('text', 'file');
        }
        if (acceptsImage) {
            tabs.push('image');
        }
        
        if (tabs.length === 0) return ['text', 'image', 'file'];

        return [...new Set(tabs)];
    }, [task]);

    const [activeTab, setActiveTab] = useState<Tab>('text');
    
    useEffect(() => {
        if (isOpen && relevantTabs.length > 0) {
            setActiveTab(relevantTabs[0]);
        }
    }, [isOpen, relevantTabs]);


    const [text, setText] = useState('');
    const [image, setImage] = useState<{ name: string; type: string; base64: string, preview: string } | null>(null);
    const [file, setFile] = useState<{ name: string; content: string } | null>(null);
    const [isDragging, setIsDragging] = useState(false);

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

    const handleFileDrop = (droppedFile: File) => {
        if (activeTab === 'image' && droppedFile.type.startsWith('image/')) {
            const mockEvent = { target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleImageUpload(mockEvent);
        } else if (activeTab === 'file') {
            const mockEvent = { target: { files: [droppedFile] } } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileUpload(mockEvent);
        }
    };
    
    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e);
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e);
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileDrop(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };


    const handleStage = () => {
        onStageInput({
            text: text || undefined,
            image: image ? { name: image.name, type: image.type, base64: image.base64 } : undefined,
            file: file || undefined,
        });
        setText('');
        setImage(null);
        setFile(null);
        onClose();
    };

    return (
        <ModalShell isOpen={isOpen} onClose={onClose} title={`Provide Input for: ${task.name}`} size="2xl">
            <div className="flex flex-col min-h-[450px] max-h-[80vh]">
                 <div className="border-b border-gray-700">
                    <nav className="-mb-px flex space-x-2">
                        {Object.entries(TABS_CONFIG).map(([key, config]) => {
                            const tabKey = key as Tab;
                            // Show tab if it's disabled (e.g. Video) OR if it's in our relevant list
                            const showTab = config.disabled || relevantTabs.includes(tabKey);

                            if (!showTab) {
                                return null;
                            }
                            
                            const Icon = config.icon;
                            return (
                                <button
                                    key={key}
                                    onClick={() => !config.disabled && setActiveTab(key as Tab)}
                                    disabled={config.disabled}
                                    title={config.tooltip}
                                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                                        activeTab === key
                                            ? 'border-blue-500 text-blue-400'
                                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600'
                                    } ${config.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{config.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>
                 <div 
                    className="flex-grow pt-4 flex flex-col bg-gray-900/50 rounded-b-lg"
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragEvents}
                    onDrop={handleDrop}
                >
                    {activeTab === 'text' && (
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Paste article text or other content here..."
                            className="w-full flex-grow p-3 border border-gray-600 bg-gray-800 text-gray-50 rounded-md resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    )}
                    {activeTab === 'image' && (
                        <div className="flex flex-col items-center justify-center flex-grow w-full">
                            {image ? (
                                <div className="text-center relative group">
                                    <img src={image.preview} alt={image.name} className="max-h-80 rounded-lg border-2 border-gray-600" />
                                    <p className="text-xs mt-2 text-gray-300 truncate">{image.name}</p>
                                    <button onClick={() => setImage(null)} className="absolute top-2 right-2 p-1 bg-gray-900/50 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove image">
                                        <XCircleIcon className="w-6 h-6"/>
                                    </button>
                                </div>
                            ) : (
                                <UploadZone
                                    id="image-upload"
                                    icon={<PhotoIcon className="w-10 h-10 mx-auto text-gray-500" />}
                                    message="Click to upload an image"
                                    accept="image/*"
                                    onUpload={handleImageUpload}
                                    isDragging={isDragging}
                                />
                            )}
                        </div>
                    )}
                     {activeTab === 'file' && (
                        <div className="flex flex-col items-center justify-center flex-grow w-full">
                           {file ? (
                                <div className="w-full text-center bg-gray-700/50 p-6 rounded-lg border-2 border-gray-600 relative group">
                                    <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-400"/>
                                    <p className="text-sm mt-3 text-gray-200">{file.name}</p>
                                    <pre className="mt-2 text-left text-xs text-gray-400 bg-gray-800 p-2 rounded-md max-h-24 overflow-auto">
                                        {file.content}
                                    </pre>
                                    <button onClick={() => setFile(null)} className="absolute top-2 right-2 p-1 bg-gray-900/50 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Remove file">
                                        <XCircleIcon className="w-6 h-6"/>
                                    </button>
                                </div>
                            ) : (
                                <UploadZone
                                    id="file-upload"
                                    icon={<DocumentTextIcon className="w-10 h-10 mx-auto text-gray-500" />}
                                    message="Click to upload a text file"
                                    accept=".txt,.md,.text,.json,.csv"
                                    onUpload={handleFileUpload}
                                    isDragging={isDragging}
                                />
                            )}
                        </div>
                    )}
                    {activeTab === 'video' && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
                            <VideoCameraIcon className="w-12 h-12 mb-3"/>
                            <h4 className="font-semibold text-gray-500">Video Uploads Coming Soon</h4>
                            <p className="text-sm">You'll be able to stage videos for analysis and generation.</p>
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
