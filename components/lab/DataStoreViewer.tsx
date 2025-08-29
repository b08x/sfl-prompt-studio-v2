import React, { useState } from 'react';
import { DataStore } from '../../types';
import ClipboardIcon from '../icons/ClipboardIcon';

const JsonViewer: React.FC<{ data: any; level?: number }> = ({ data, level = 0 }) => {
    const [isCollapsed, setIsCollapsed] = useState(level > 0);

    if (data === null || data === undefined) {
        return <span className="text-gray-500">null</span>;
    }
    if (typeof data !== 'object') {
        return <span className={typeof data === 'string' ? 'text-teal-300' : 'text-blue-400'}>{JSON.stringify(data)}</span>;
    }

    const entries = Object.entries(data);
    const prefix = Array.isArray(data) ? '[' : '{';
    const suffix = Array.isArray(data) ? ']' : '}';

    return (
        <div>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="cursor-pointer">
                <span className="text-gray-400">{prefix}</span>
                {isCollapsed && <span className="text-gray-500 mx-1">...</span>}
                <span className="text-gray-400">{suffix}</span>
                <span className="text-xs text-gray-500 ml-1">{entries.length} items</span>
            </button>
            {!isCollapsed && (
                <div style={{ paddingLeft: `${(level + 1) * 15}px` }} className="border-l border-gray-700 ml-1.5">
                    {entries.map(([key, value]) => (
                        <div key={key} className="flex text-sm">
                            {!Array.isArray(data) && <span className="text-violet-400 mr-1">"{key}":</span>}
                            <JsonViewer data={value} level={level + 1} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const DataStoreViewer: React.FC<{ dataStore: DataStore }> = ({ dataStore }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(dataStore, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4 h-full font-mono">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-50">Data Store</h3>
                <button
                    onClick={handleCopy}
                    className="p-1.5 bg-gray-700 rounded-md text-gray-400 hover:text-gray-200 transition-colors border border-gray-600"
                    title="Copy DataStore JSON"
                >
                    {copied ? <span className="text-xs">Copied!</span> : <ClipboardIcon className="w-4 h-4" />}
                </button>
            </div>
            <div className="bg-gray-900 p-3 rounded-md text-sm border border-gray-700 h-[calc(100%-50px)] overflow-auto">
                {Object.keys(dataStore).length > 0 ? (
                    <JsonViewer data={dataStore} />
                ) : (
                    <p className="text-gray-500 text-xs">Data Store is empty. Run a workflow to populate it.</p>
                )}
            </div>
        </div>
    );
};

export default DataStoreViewer;