
import React, { useState } from 'react';
import { SFLMode } from '../../types';

interface SFLModeSectionProps {
  sflMode: SFLMode;
  onChange: <F extends keyof SFLMode>(field: F, value: SFLMode[F]) => void;
  appConstants: {
    outputFormats: string[];
    lengthConstraints: string[];
  };
  onAddConstant: (key: 'outputFormats' | 'lengthConstraints', value: string) => void;
}

const SFLModeSection: React.FC<SFLModeSectionProps> = ({ sflMode, onChange, appConstants, onAddConstant }) => {
  const [newOptions, setNewOptions] = useState({
    outputFormat: '',
    lengthConstraint: ''
  });

  const commonInputClasses = "w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500";
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";

  const handleAddOption = (key: keyof typeof newOptions, constantKey: 'outputFormats' | 'lengthConstraints', fieldKey: keyof SFLMode) => {
    const value = newOptions[key];
    if (value && value.trim()) {
      onAddConstant(constantKey, value);
      // @ts-ignore
      onChange(fieldKey, value);
      setNewOptions(prev => ({ ...prev, [key]: '' }));
    }
  };

  const renderSelectWithAdd = (
    field: keyof SFLMode,
    label: string,
    options: string[],
    newOptionKey: keyof typeof newOptions,
    constantKey: 'outputFormats' | 'lengthConstraints'
  ) => (
    <div>
      <label htmlFor={`sflMode-${field}`} className={labelClasses}>{label}</label>
      <select
        id={`sflMode-${field}`}
        // @ts-ignore
        value={sflMode[field]}
        // @ts-ignore
        onChange={(e) => onChange(field, e.target.value)}
        className={`${commonInputClasses} appearance-none`}
      >
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
      <div className="flex items-center space-x-2 mt-2">
        <input
          type="text"
          placeholder="Add new option..."
          value={newOptions[newOptionKey]}
          onChange={e => setNewOptions(prev => ({ ...prev, [newOptionKey]: e.target.value }))}
          className={`${commonInputClasses} text-sm`}
        />
        <button type="button" onClick={() => handleAddOption(newOptionKey, constantKey, field)} className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md shrink-0 text-gray-200">Add</button>
      </div>
    </div>
  );

  return (
    <fieldset className="border border-gray-700 p-4 rounded-md">
      <legend className="text-lg font-medium text-pink-400 px-2">SFL: Mode (What role is language playing?)</legend>
      <div className="space-y-4 mt-2">
        {renderSelectWithAdd('outputFormat', 'Output Format', appConstants.outputFormats, 'outputFormat', 'outputFormats')}
        
        <div>
          <label htmlFor="sflMode-rhetoricalStructure" className={labelClasses}>Rhetorical Structure</label>
          <textarea
            id="sflMode-rhetoricalStructure"
            value={sflMode.rhetoricalStructure}
            onChange={(e) => onChange('rhetoricalStructure', e.target.value)}
            placeholder="e.g., Intro, 3 points, conclusion; Problem-Solution"
            rows={3}
            className={commonInputClasses}
          />
        </div>

        {renderSelectWithAdd('lengthConstraint', 'Length Constraint', appConstants.lengthConstraints, 'lengthConstraint', 'lengthConstraints')}

        <div>
          <label htmlFor="sflMode-textualDirectives" className={labelClasses}>Textual Directives</label>
          <textarea
            id="sflMode-textualDirectives"
            value={sflMode.textualDirectives}
            onChange={(e) => onChange('textualDirectives', e.target.value)}
            placeholder="e.g., Use active voice, Avoid jargon"
            rows={3}
            className={commonInputClasses}
          />
        </div>
      </div>
    </fieldset>
  );
};

export default SFLModeSection;
