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
    availableModels,
    defaultProvider,
    defaultModel,
    setDefaultProvider,
    setDefaultModel,
  } = useStore();

  const [expandedProvider, setExpandedProvider] = React.useState<AIProvider | null>(null);

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

      {/* Default Provider & Model Section */}
      <section className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-6 h-6 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-50">Default Provider & Model</h2>
        </div>

        <div className="space-y-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-gray-200 font-medium">Default Provider</label>
            <select
              value={defaultProvider}
              onChange={(e) => setDefaultProvider(e.target.value as AIProvider)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(AIProvider).map((provider) => (
                <option key={provider} value={provider}>
                  {providerDisplayNames[provider]}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              This provider will be used by default for new tasks and prompts.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-gray-200 font-medium">Default Model</label>
            <select
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableModels[defaultProvider].length > 0 ? (
                availableModels[defaultProvider].map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.supportsVision ? '🖼️' : ''}
                  </option>
                ))
              ) : (
                <option value={defaultModel}>{defaultModel}</option>
              )}
            </select>
            <p className="text-xs text-gray-500">
              This model will be used by default for the selected provider.
            </p>
          </div>
        </div>
      </section>

      {/* Available Models Section */}
      <section className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-6 h-6 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-50">Available Models</h2>
        </div>

        <div className="space-y-3">
          {Object.values(AIProvider).map((provider) => {
            const models = availableModels[provider];
            const isExpanded = expandedProvider === provider;
            const hasModels = models.length > 0;

            return (
              <div key={provider} className="bg-gray-900 rounded-lg border border-gray-700">
                <button
                  onClick={() => setExpandedProvider(isExpanded ? null : provider)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
                  disabled={!hasModels}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-200 font-medium">
                      {providerDisplayNames[provider]}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({hasModels ? `${models.length} models` : 'No models available'})
                    </span>
                  </div>
                  {hasModels && (
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                {isExpanded && hasModels && (
                  <div className="border-t border-gray-700 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {models.map((model) => (
                        <div
                          key={model.id}
                          className="bg-gray-800 rounded-lg p-3 border border-gray-600"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-gray-200 font-medium text-sm">{model.name}</h4>
                              <p className="text-gray-400 text-xs mt-1 font-mono">{model.id}</p>
                            </div>
                            {model.supportsVision && (
                              <span className="text-lg" title="Supports Vision">🖼️</span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            <span>Context: {(model.contextWindow / 1000).toFixed(0)}K</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">
            <strong className="text-gray-300">Note:</strong> Models are discovered automatically when you validate an API key.
            Click "Verify" above to refresh the available models for each provider.
          </p>
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
