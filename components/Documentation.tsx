import React from 'react';
import Icon from './Icon';
import createApiImg from '../assets/images/Create-api.png';
import copyApiImg from '../assets/images/Copy_api-key.png';
import ApiKeyMenuIcon from './ApiKeyMenuIcon';

interface DocumentationProps {
  onBack: () => void;
}

const Documentation: React.FC<DocumentationProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header - Same as the main app + Back button */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 flex items-center">
              <Icon name="fas fa-palette" className="text-primary mr-2" />
              AI HtmlBuilder
              <ApiKeyMenuIcon />
            </h1>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center"
            >
              <Icon name="fas fa-arrow-left" className="mr-2" />
              Back to Builder
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Centered and clean */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto text-center">
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            How to Get Your Gemini API Key
          </h1>
          
          <p className="text-lg text-gray-600 mb-10">
            Follow these simple steps to get your API key from Google AI Studio and start building.
          </p>

          {/* Step 1 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Step 1: Create a New API Key
            </h2>
            <p className="text-gray-700 mb-5 max-w-2xl mx-auto">
              First, go to the <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Google AI Studio</a>. Click on <strong>"Create a new API key"</strong> and select a project.
            </p>
            <img 
              src={createApiImg} 
              alt="Dialog to create a new API key" 
              className="w-full max-w-3xl mx-auto shadow-lg"
            />
          </div>

          {/* Step 2 */}
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              Step 2: Copy Your API Key
            </h2>
            <p className="text-gray-700 mb-5 max-w-2xl mx-auto">
              A dialog will appear with your new key. Click the <strong>Copy</strong> icon next to it. You can now paste this key into the application by clicking the key icon in the header.
            </p>
            <img 
              src={copyApiImg} 
              alt="Dialog showing the generated API key" 
              className="w-full max-w-3xl mx-auto shadow-lg"
            />
          </div>
          
          <button onClick={onBack} className="mt-6 text-primary hover:underline font-medium">
            Back to the main page
          </button>

        </div>
      </main>
    </div>
  );
};

export default Documentation;