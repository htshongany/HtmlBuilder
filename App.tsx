import React, { useState, useCallback, useEffect } from 'react';
import Icon from './components/Icon';
import ImageUpload from './components/ImageUpload';
import PreviewPanel from './components/PreviewPanel';
import CodePanel from './components/CodePanel';
import { generateHtmlFromImage } from './services/geminiService';
import { UploadOption, ComponentType, AdvancedOptions, GenerationParams } from './types';
import { 
  COMPONENT_TYPES_ARRAY, COMPONENT_TYPE_ICONS, 
  INITIAL_ADVANCED_OPTIONS,
  DEFAULT_COMPONENT_TYPE,
  SAMPLE_HTML_PREVIEW, SAMPLE_GENERATED_CODE
} from './constants';

const App: React.FC = () => {
  const [uploadOption, setUploadOption] = useState<UploadOption>(UploadOption.Basic);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  const [componentType, setComponentType] = useState<ComponentType>(DEFAULT_COMPONENT_TYPE);
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>(INITIAL_ADVANCED_OPTIONS);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(SAMPLE_HTML_PREVIEW);
  const [generatedCodeForDisplay, setGeneratedCodeForDisplay] = useState<string | null>(SAMPLE_GENERATED_CODE);
  const [error, setError] = useState<string | null>(null);

  const [isStopped, setIsStopped] = useState<boolean>(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [isCodeViewActive, setIsCodeViewActive] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [isCodeFullscreen, setIsCodeFullscreen] = useState(false);

  // Nouvel état pour contrôler la visibilité du panneau de configuration
  const [showConfigPanel, setShowConfigPanel] = useState(true);

  useEffect(() => {
    if (uploadOption === UploadOption.Basic) {
      setCustomPrompt('');
    }
  }, [uploadOption]);

  const handleImageSelect = useCallback((file: File | null, dataUrl: string | null) => {
    setSelectedImageFile(file);
    setImagePreviewUrl(dataUrl);
  }, []);

  const handleReset = () => {
    setUploadOption(UploadOption.CustomPrompt);
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setCustomPrompt('');
    setComponentType(DEFAULT_COMPONENT_TYPE);
    setAdvancedOptions(INITIAL_ADVANCED_OPTIONS);
    setGeneratedHtml(SAMPLE_HTML_PREVIEW);
    setGeneratedCodeForDisplay(SAMPLE_GENERATED_CODE);
    setError(null);
    setIsLoading(false);
    const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleStop = () => {
    setIsStopped(true);
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleSubmit = async () => {
    if (!useCustomPrompt && uploadOption === UploadOption.Basic && (!selectedImageFile || !imagePreviewUrl)) {
      setError('Please upload an image.');
      return;
    }
    if (useCustomPrompt && !customPrompt.trim()) {
      setError('Custom prompt cannot be empty when enabled.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsStopped(false);
    setGeneratedHtml(null); 
    setGeneratedCodeForDisplay(null);

    const generationParams: GenerationParams = {
      imageDataBase64: imagePreviewUrl || '',
      mimeType: (uploadOption === UploadOption.Basic && selectedImageFile) ? selectedImageFile.type : 'text/plain',
      customPromptText: useCustomPrompt ? customPrompt : '',
      componentType,
      advancedOptions,
    };

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const {html} = await generateHtmlFromImage(generationParams, abortController.signal);
      if (isStopped) return;
      setGeneratedHtml(html);
      setGeneratedCodeForDisplay(html); 
    } catch (err) {
      if (isStopped) return;
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Generation Failed: ${errorMessage}`);
      setGeneratedHtml(`<div class="p-4 text-red-500 text-center">${errorMessage}</div>`);
      setGeneratedCodeForDisplay(`// Error: ${errorMessage}`);
    } finally {
      if (!isStopped) setIsLoading(false);
    }
  };

  const Header: React.FC = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800 flex items-center">
            <Icon name="fas fa-palette" className="text-primary mr-2" /> 
            AI Web Page Generator
          </h1>
          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className="lg:hidden px-3 py-1.5 text-sm font-medium text-primary hover:bg-indigo-50 rounded-md transition-colors"
          >
            <Icon name={showConfigPanel ? "fas fa-times" : "fas fa-cog"} className="mr-1.5" />
            {showConfigPanel ? 'Hide' : 'Config'}
          </button>
        </div>
      </div>
    </header>
  );
  
  const COMPONENTS_VISIBLE_INIT = 5;
  const [showAllComponents, setShowAllComponents] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Configuration Panel - Collapsible on mobile, fixed on desktop */}
        <div className={`
          ${showConfigPanel ? 'block' : 'hidden'} 
          lg:block lg:w-80 xl:w-96 
          absolute lg:relative z-40 lg:z-auto
          inset-0 lg:inset-auto
          bg-white lg:bg-transparent
        `}>
          <div className="h-full flex flex-col bg-white shadow-lg lg:shadow-none border-r border-gray-200">
            {/* Compact Header */}
            {/* Removed: Configuration and Upload image & customize options */}
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Upload Image Section */}
              <div className="space-y-3">
                <div className="text-base font-semibold text-gray-800 text-center border-b pb-1 mb-2">Upload Image</div>
                <ImageUpload onImageSelect={handleImageSelect} imagePreviewUrl={imagePreviewUrl} hideLabel />
              </div>

              {/* Component Type Section */}
              <div className="space-y-3">
                <div className="text-base font-semibold text-gray-800 text-center border-b pb-1 mb-2">Component Type</div>
                <div className="grid grid-cols-2 gap-2">
                  {(showAllComponents ? COMPONENT_TYPES_ARRAY : COMPONENT_TYPES_ARRAY.slice(0, COMPONENTS_VISIBLE_INIT)).map((type) => (
                    <button
                      key={type}
                      onClick={() => setComponentType(type)}
                      className={`p-2 bg-gray-50 rounded-lg text-gray-700 transition flex flex-col items-center justify-center text-center min-h-[60px] ${
                        componentType === type 
                          ? 'bg-primary/10 border-2 border-primary text-primary' 
                          : 'hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <Icon name={COMPONENT_TYPE_ICONS[type]} className="text-lg mb-1" />
                      <span className="text-xs font-medium">{type}</span>
                    </button>
                  ))}
                  {!showAllComponents && COMPONENT_TYPES_ARRAY.length > COMPONENTS_VISIBLE_INIT && (
                    <button
                      onClick={() => setShowAllComponents(true)}
                      className="p-2 bg-gray-100 rounded-lg text-gray-600 flex flex-col items-center justify-center text-center min-h-[60px] hover:bg-gray-200 transition border-2 border-transparent"
                    >
                      <Icon name="fas fa-plus" className="text-lg mb-1" />
                      <span className="text-xs font-medium">More</span>
                    </button>
                  )}
                  {showAllComponents && COMPONENT_TYPES_ARRAY.length > COMPONENTS_VISIBLE_INIT && (
                    <button
                      onClick={() => setShowAllComponents(false)}
                      className="p-2 bg-gray-100 rounded-lg text-gray-600 flex flex-col items-center justify-center text-center min-h-[60px] hover:bg-gray-200 transition border-2 border-transparent"
                    >
                      <Icon name="fas fa-minus" className="text-lg mb-1" />
                      <span className="text-xs font-medium">Less</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3">
                <div className="text-base font-semibold text-gray-800 text-center border-b pb-1 mb-2">Advanced Options</div>
                <div className="space-y-2">
                  {(Object.keys(advancedOptions) as Array<keyof AdvancedOptions>).map(key => {
                    let labelText = key.replace(/([A-Z])/g, ' $1');
                    if (key === 'javascript') labelText = 'Functional JavaScript';
                    return (
                      <label key={key} className="flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={advancedOptions[key]}
                          onChange={(e) => setAdvancedOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary mr-3"
                        />
                        {labelText}
                      </label>
                    );
                  })}
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={useCustomPrompt}
                      onChange={() => setUseCustomPrompt(v => !v)}
                      className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary mr-3"
                    />
                    Custom Prompt
                  </label>
                </div>
              </div>

              {/* Custom Prompt */}
              {useCustomPrompt && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Custom Instructions</h3>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm resize-none"
                    placeholder="Enter your custom instructions..."
                  />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              <button
                onClick={isLoading ? handleStop : handleSubmit}
                disabled={
                  (useCustomPrompt && !customPrompt.trim()) ||
                  (!useCustomPrompt && (!selectedImageFile || !imagePreviewUrl))
                }
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                  isLoading 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                <Icon name={isLoading ? "fas fa-stop" : "fas fa-bolt"} className="mr-2" />
                {isLoading ? 'Stop Generation' : 'Generate Code'}
              </button>
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Icon name="fas fa-redo" className="mr-2" />
                Reset All
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Results Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {isLoading ? 'AI is Working...' : isCodeViewActive ? 'Generated Code' : 'Live Preview'}
              </h2>
              {isLoading && (
                <div className="flex items-center text-sm text-gray-600">
                  <Icon name="fas fa-spinner fa-spin" className="mr-2" />
                  Generating...
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsCodeViewActive(!isCodeViewActive)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isCodeViewActive 
                    ? 'bg-primary text-white' 
                    : 'text-primary hover:bg-indigo-50'
                }`}
              >
                <Icon name={isCodeViewActive ? "fas fa-eye" : "fas fa-code"} className="mr-1.5" />
                {isCodeViewActive ? 'Preview' : 'Code'}
              </button>
            </div>
          </div>

          {/* Results Content */}
          <div className="flex-1 relative overflow-hidden">
            {isCodeViewActive ? (
              <CodePanel 
                className="absolute inset-0"
                code={generatedCodeForDisplay}
                isLoading={isLoading && !generatedCodeForDisplay}
                isFullscreen={isCodeFullscreen}
                onToggleFullscreen={() => setIsCodeFullscreen(!isCodeFullscreen)}
              />
            ) : (
              <PreviewPanel 
                className="absolute inset-0"
                htmlContent={generatedHtml}
                isFullscreen={isPreviewFullscreen}
                onToggleFullscreen={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                isLoading={isLoading && !generatedHtml}
              />
            )}
          </div>
        </div>

        {/* Overlay for mobile when config panel is open */}
        {showConfigPanel && (
          <div 
            className="lg:hidden absolute inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setShowConfigPanel(false)}
          />
        )}
      </main>
    </div>
  );
}

export default App;