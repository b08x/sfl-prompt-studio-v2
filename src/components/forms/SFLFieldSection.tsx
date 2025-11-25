
import React, { useState } from 'react';
import { SFLField, PromptSFL } from '../../types';

interface SFLFieldSectionProps {
  sflField: SFLField;
  onChange: <F extends keyof SFLField>(field: F, value: SFLField[F]) => void;
  appConstants: {
    taskTypes: string[];
  };
  onAddConstant: (key: 'taskTypes', value: string) => void;
}

const SFLFieldSection: React.FC<SFLFieldSectionProps> = ({ sflField, onChange, appConstants, onAddConstant }) => {
  const [newOptionValue, setNewOptionValue] = useState('');

  const commonInputClasses = "w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500";
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";

  const handleAddOption = () => {
    if (newOptionValue && newOptionValue.trim()) {
      onAddConstant('taskTypes', newOptionValue);
      onChange('taskType', newOptionValue);
      setNewOptionValue('');
    }
  };

  return (
    <fieldset className="border border-gray-700 p-4 rounded-md">
      <legend className="text-lg font-medium text-amber-400 px-2">SFL: Field (What is happening?)</legend>
      <div className="space-y-4 mt-2">
        <div>
          <label htmlFor="sflField-topic" className={labelClasses}>Topic</label>
          <input
            type="text"
            id="sflField-topic"
            value={sflField.topic}
            onChange={(e) => onChange('topic', e.target.value)}
            placeholder="e.g., Quantum Physics, Recipe Generation"
            className={commonInputClasses}
          />
        </div>

        <div>
          <label htmlFor="sflField-taskType" className={labelClasses}>Task Type</label>
          <select
            id="sflField-taskType"
            value={sflField.taskType}
            onChange={(e) => onChange('taskType', e.target.value)}
            className={`${commonInputClasses} appearance-none`}
          >
            {appConstants.taskTypes.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="text"
              placeholder="Add new option..."
              value={newOptionValue}
              onChange={e => setNewOptionValue(e.target.value)}
              className={`${commonInputClasses} text-sm`}
            />
            <button type="button" onClick={handleAddOption} className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md shrink-0 text-gray-200">Add</button>
          </div>
        </div>

        <div>
          <label htmlFor="sflField-domainSpecifics" className={labelClasses}>Domain Specifics</label>
          <textarea
            id="sflField-domainSpecifics"
            value={sflField.domainSpecifics}
            onChange={(e) => onChange('domainSpecifics', e.target.value)}
            placeholder="e.g., Python 3.9, pandas; Italian cuisine"
            rows={3}
            className={commonInputClasses}
          />
        </div>

        <div>
          <label htmlFor="sflField-keywords" className={labelClasses}>Keywords</label>
          <input
            type="text"
            id="sflField-keywords"
            value={sflField.keywords}
            onChange={(e) => onChange('keywords', e.target.value)}
            placeholder="Comma-separated, e.g., sfl, linguistics, AI"
            className={commonInputClasses}
          />
        </div>
      </div>
    </fieldset>
  );
};

export default SFLFieldSection;
