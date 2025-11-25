import React from 'react';
import { useStore } from '../store/useStore';
import { AIProvider } from '../types/ai';
import CogIcon from './icons/CogIcon';
import CheckIcon from './icons/CheckIcon';
import XCircleIcon from './icons/XCircleIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';

const SettingsPage: React.FC = () => {
  const {
    userApiKeys,
    apiKeyValidation,
    setApiKey,
    validateProviderKey,
    globalModelParams,
    setGlobalModelParams,
  } = useStore();

  const providerDisplayNames: Record<AIProvider, string> = {
    [AIProvider.Google]: 'Google (Gemini)',
    [AIProvider.OpenAI]: 'OpenAI',
    [AIProvider.OpenRouter]: 'OpenRouter',
    [AIProvider.Anthropic]: 'Anthropic (Claude)',
    [AIProvider.Mistral]: 'Mistral',
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckIcon className="w-5 h-5 text-green-500" />;
      case 'invalid':
      case 'ratelimited':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'checking':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid':
        return <span className="text-green-500 text-sm">Valid</span>;
      case 'invalid':
        return <span className="text-red-500 text-sm">Invalid</span>;
      case 'ratelimited':
        return <span className="text-yellow-500 text-sm">Rate Limited</span>;
      case 'checking':
        return <span className="text-blue-500 text-sm">Checking...</span>;
      case 'unverified':
        return <span className="text-gray-400 text-sm">Not verified</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <CogIcon className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold text-gray-50">Settings</h1>
      </div>

      {/* Provider API Keys Section */}
      <section className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-6 h-6 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-50">Provider API Keys</h2>
        </div>

        <div className="space-y-4">
          {Object.values(AIProvider).map((provider) => (
            <div key={provider} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-200 font-medium">
                  {providerDisplayNames[provider]}
                </label>
                {getStatusIcon(apiKeyValidation[provider])}
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="password"
                  value={userApiKeys[provider]}
                  onChange={(e) => setApiKey(provider, e.target.value)}
                  placeholder={`Enter ${providerDisplayNames[provider]} API key`}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => validateProviderKey(provider)}
                  disabled={!userApiKeys[provider] || apiKeyValidation[provider] === 'checking'}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Verify
                </button>
              </div>

              <div className="mt-2 flex items-center space-x-2">
                {getStatusText(apiKeyValidation[provider])}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Note:</strong> API keys can also be set via environment variables:
          </p>
          <ul className="mt-2 text-sm text-gray-400 space-y-1 ml-4">
            <li>• <code className="text-blue-400">VITE_GOOGLE_API_KEY</code></li>
            <li>• <code className="text-blue-400">VITE_OPENAI_API_KEY</code></li>
            <li>• <code className="text-blue-400">VITE_OPENROUTER_API_KEY</code></li>
            <li>• <code className="text-blue-400">VITE_ANTHROPIC_API_KEY</code></li>
            <li>• <code className="text-blue-400">VITE_MISTRAL_API_KEY</code></li>
          </ul>
        </div>
      </section>

      {/* Global Model Parameters Section */}
      <section className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <WrenchScrewdriverIcon className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-50">Global Model Parameters</h2>
        </div>

        <div className="space-y-6">
          {/* Temperature Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-gray-200 font-medium">Temperature</label>
              <span className="text-gray-400 text-sm">{globalModelParams.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={globalModelParams.temperature}
              onChange={(e) => setGlobalModelParams({ temperature: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-gray-500">
              Controls randomness. Lower values make output more focused and deterministic.
            </p>
          </div>

          {/* Top P Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-gray-200 font-medium">Top P (Nucleus Sampling)</label>
              <span className="text-gray-400 text-sm">{globalModelParams.topP.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={globalModelParams.topP}
              onChange={(e) => setGlobalModelParams({ topP: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-xs text-gray-500">
              Controls diversity via nucleus sampling. Lower values make output more focused.
            </p>
          </div>

          {/* Top K Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-gray-200 font-medium">Top K</label>
              <input
                type="number"
                min="1"
                max="100"
                value={globalModelParams.topK}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 1 && value <= 100) {
                    setGlobalModelParams({ topK: value });
                  }
                }}
                className="w-20 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              Limits sampling to top K tokens. Higher values allow more diversity.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Note:</strong> These parameters serve as default values for AI model interactions.
            Individual prompts or workflows may override these settings.
          </p>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
