
import React, { useState } from 'react';
import { SFLTenor } from '../../types';

interface SFLTenorSectionProps {
  sflTenor: SFLTenor;
  onChange: <F extends keyof SFLTenor>(field: F, value: SFLTenor[F]) => void;
  appConstants: {
    aiPersonas: string[];
    desiredTones: string[];
    targetAudiences: string[];
  };
  onAddConstant: (key: 'aiPersonas' | 'desiredTones' | 'targetAudiences', value: string) => void;
}

const SFLTenorSection: React.FC<SFLTenorSectionProps> = ({ sflTenor, onChange, appConstants, onAddConstant }) => {
  const [newOptions, setNewOptions] = useState({
    aiPersona: '',
    desiredTone: '',
    targetAudience: ''
  });

  const commonInputClasses = "w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500";
  const labelClasses = "block text-sm font-medium text-gray-300 mb-1";

  const handleAddOption = (key: keyof typeof newOptions, constantKey: 'aiPersonas' | 'desiredTones' | 'targetAudiences', fieldKey: keyof SFLTenor) => {
    const value = newOptions[key];
    if (value && value.trim()) {
      onAddConstant(constantKey, value);
      if (fieldKey === 'targetAudience') {
         // For array types like targetAudience, handle externally or specifically
         const current = sflTenor.targetAudience || [];
         if(!current.includes(value)) {
             onChange('targetAudience', [...current, value]);
         }
      } else {
         // @ts-ignore
         onChange(fieldKey, value);
      }
      setNewOptions(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleTargetAudienceToggle = (audience: string) => {
    const currentAudiences = sflTenor.targetAudience || [];
    const newAudiences = currentAudiences.includes(audience)
      ? currentAudiences.filter(a => a !== audience)
      : [...currentAudiences, audience];
    onChange('targetAudience', newAudiences);
  };

  const renderSelectWithAdd = (
    field: keyof SFLTenor, 
    label: string, 
    options: string[], 
    newOptionKey: keyof typeof newOptions, 
    constantKey: 'aiPersonas' | 'desiredTones'
  ) => (
    <div>
      <label htmlFor={`sflTenor-${field}`} className={labelClasses}>{label}</label>
      <select
        id={`sflTenor-${field}`}
        // @ts-ignore
        value={sflTenor[field]}
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
      <legend className="text-lg font-medium text-violet-400 px-2">SFL: Tenor (Who is taking part?)</legend>
      <div className="space-y-4 mt-2">
        {renderSelectWithAdd('aiPersona', 'AI Persona', appConstants.aiPersonas, 'aiPersona', 'aiPersonas')}

        <div>
          <label className={labelClasses}>Target Audience</label>
          <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-y-auto p-2 border border-gray-700 rounded-md bg-gray-900">
            {(appConstants.targetAudiences || []).map(audience => (
              <div key={audience} className="flex items-center">
                <input
                  id={`audience-${audience}`}
                  type="checkbox"
                  checked={(sflTenor.targetAudience || []).includes(audience)}
                  onChange={() => handleTargetAudienceToggle(audience)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800"
                />
                <label htmlFor={`audience-${audience}`} className="ml-2 text-sm text-gray-300 select-none">{audience}</label>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="text"
              placeholder="Add new audience..."
              value={newOptions.targetAudience}
              onChange={e => setNewOptions(prev => ({ ...prev, targetAudience: e.target.value }))}
              className={`${commonInputClasses} text-sm`}
            />
            <button type="button" onClick={() => handleAddOption('targetAudience', 'targetAudiences', 'targetAudience')} className="px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 rounded-md shrink-0 text-gray-200">Add</button>
          </div>
        </div>

        {renderSelectWithAdd('desiredTone', 'Desired Tone', appConstants.desiredTones, 'desiredTone', 'desiredTones')}

        <div>
          <label htmlFor="sflTenor-interpersonalStance" className={labelClasses}>Interpersonal Stance</label>
          <textarea
            id="sflTenor-interpersonalStance"
            value={sflTenor.interpersonalStance}
            onChange={(e) => onChange('interpersonalStance', e.target.value)}
            placeholder="e.g., Act as a mentor, Be a collaborative partner"
            rows={3}
            className={commonInputClasses}
          />
        </div>
      </div>
    </fieldset>
  );
};

export default SFLTenorSection;
