import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react';
import { generateHtmlFromImage } from './services/geminiService';
import { UploadOption, ComponentType, AdvancedOptions, GenerationParams } from './types';
import { 
  COMPONENT_TYPES_ARRAY, COMPONENT_TYPE_ICONS, 
  INITIAL_ADVANCED_OPTIONS,
  DEFAULT_COMPONENT_TYPE,
  SAMPLE_HTML_PREVIEW, SAMPLE_GENERATED_CODE
} from './constants';
import './css/custom-scrollbar.css';
import ApiKeyMenuIcon from './components/ApiKeyMenuIcon';
import { useApiKeyValue } from './hooks/useApiKeyValue';

// Remplacer les imports directs par du lazy loading
const Icon = lazy(() => import('./components/Icon'));
const ImageUpload = lazy(() => import('./components/ImageUpload'));
const PreviewPanel = lazy(() => import('./components/PreviewPanel'));
const CodePanel = lazy(() => import('./components/CodePanel'));

// Utilitaires pour localStorage
const LOCAL_STORAGE_KEY = 'htmlbuilder_last_session';

function saveSessionToLocalStorage(state: any) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Optionnel: afficher une erreur ou ignorer
  }
}

function loadSessionFromLocalStorage() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

const App: React.FC = () => {
  const sessionCache = loadSessionFromLocalStorage();

  const [uploadOption, setUploadOption] = useState<UploadOption>(sessionCache?.uploadOption ?? UploadOption.Basic);
  // Correction image: on ne restaure que l'URL base64 pour l'aperçu, pas de File
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(sessionCache?.imagePreviewUrl ?? null);
  const [customPrompt, setCustomPrompt] = useState<string>(sessionCache?.customPrompt ?? '');
  const [componentType, setComponentType] = useState<ComponentType>(sessionCache?.componentType ?? DEFAULT_COMPONENT_TYPE);
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>(sessionCache?.advancedOptions ?? INITIAL_ADVANCED_OPTIONS);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(sessionCache?.generatedHtml ?? SAMPLE_HTML_PREVIEW);
  const [generatedCodeForDisplay, setGeneratedCodeForDisplay] = useState<string | null>(sessionCache?.generatedCodeForDisplay ?? SAMPLE_GENERATED_CODE);
  const [error, setError] = useState<string | null>(null);

  const [isStopped, setIsStopped] = useState<boolean>(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const [useCustomPrompt, setUseCustomPrompt] = useState(sessionCache?.useCustomPrompt ?? false);
  const [isCodeViewActive, setIsCodeViewActive] = useState(false);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [isCodeFullscreen, setIsCodeFullscreen] = useState(false);

  // Nouvel état pour contrôler la visibilité du panneau de configuration
  const [showConfigPanel, setShowConfigPanel] = useState(true);

  const apiKey = useApiKeyValue();

  const [flashError, setFlashError] = useState<{ text: string; apiKeyLink?: boolean } | null>(null);

  const showFlashError = (msg: string) => {
    let userMsg = msg;
    let apiKeyLink = undefined;
    try {
      // Ex: Failed to generate HTML from image: {"error":{"code":503,...}}
      const match = msg.match(/Failed to generate HTML from image: (\{.*\})/);
      if (match && match[1]) {
        const errObj = JSON.parse(match[1]);
        if (errObj.error) {
          userMsg = `Error ${errObj.error.code}: ${errObj.error.message}`;
        }
      }
      // Cas API_KEY manquante
      if (msg.includes('API_KEY is not configured')) {
        userMsg = "Gemini API key is missing. Please generate one.";
        apiKeyLink = true;
      }
    } catch {}
    setFlashError({ text: userMsg, apiKeyLink });
    setTimeout(() => setFlashError(null), 10000);
  };

  useEffect(() => {
    if (uploadOption === UploadOption.Basic) {
      setCustomPrompt('');
    }
  }, [uploadOption]);

  const handleImageSelect = useCallback((file: File | null, dataUrl: string | null) => {
    setSelectedImageFile(file);
    setImagePreviewUrl(dataUrl);
  }, []);

  // Correction du reset : tout réinitialiser + effacer le cache
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
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleStop = () => {
    setIsStopped(true);
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const getImageMimeType = () => {
    if (selectedImageFile && selectedImageFile.type) return selectedImageFile.type;
    if (imagePreviewUrl) {
      const match = imagePreviewUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
      return match ? match[1] : 'image/png';
    }
    return 'text/plain';
  };

  const handleSubmit = async () => {
    if (!useCustomPrompt && uploadOption === UploadOption.Basic && !imagePreviewUrl) {
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
      mimeType: getImageMimeType(),
      customPromptText: useCustomPrompt ? customPrompt : '',
      componentType,
      advancedOptions,
    };

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const {html} = await generateHtmlFromImage(generationParams, abortController.signal, apiKey || undefined);
      if (isStopped) return;
      setGeneratedHtml(html);
      setGeneratedCodeForDisplay(html); 
    } catch (err) {
      if (isStopped) return;
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      showFlashError(errorMessage);
      setGeneratedHtml(null);
      setGeneratedCodeForDisplay(null);
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
            AI HtmlBuilder
            <ApiKeyMenuIcon />
          </h1>
          <div className="flex items-center gap-2">
            {/* Bouton de thème supprimé */}
            <button
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="lg:hidden px-3 py-1.5 text-sm font-medium text-primary hover:bg-indigo-50 rounded-md transition-colors"
            >
              <Icon name={showConfigPanel ? "fas fa-times" : "fas fa-cog"} className="mr-1.5" />
              {showConfigPanel ? 'Hide' : 'Config'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
  
  const COMPONENTS_VISIBLE_INIT = 5;
  const [showAllComponents, setShowAllComponents] = useState(false);

  // Sauvegarde automatique à chaque modification importante
  useEffect(() => {
    const session = {
      uploadOption,
      selectedImageFile: selectedImageFile ? {
        name: selectedImageFile.name,
        type: selectedImageFile.type,
        size: selectedImageFile.size,
        dataUrl: imagePreviewUrl
      } : null,
      imagePreviewUrl,
      customPrompt,
      componentType,
      advancedOptions,
      generatedHtml,
      generatedCodeForDisplay,
      useCustomPrompt
    };
    saveSessionToLocalStorage(session);
  }, [uploadOption, selectedImageFile, imagePreviewUrl, customPrompt, componentType, advancedOptions, generatedHtml, generatedCodeForDisplay, useCustomPrompt]);

  return (
    <div
      className="flex flex-col h-screen bg-gray-50"
    >
      {/* Flash error notification */}
      {flashError && (
        <div className="fixed top-0 left-0 w-full z-[200] flex justify-center animate-fade-in-out transition-all duration-300">
          <div className="w-full max-w-2xl mx-auto bg-indigo-600 text-white px-6 py-4 rounded-b-lg shadow-lg flex items-center gap-3 border-b-4 border-indigo-800" style={{fontWeight: 500, fontSize: '1rem'}}>
            <Icon name="fas fa-exclamation-triangle" className="text-white text-xl mr-2" />
            <span className="flex-1 text-center">
              {typeof flashError === 'string' ? flashError : flashError.text}
              {flashError.apiKeyLink && (
                <>
                  <br />
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition-colors duration-200 shadow"
                    style={{ textDecoration: 'none' }}
                  >
                    Generate a Gemini API key
                  </a>
                </>
              )}
            </span>
          </div>
        </div>
      )}
      {/* Fin flash error */}
      <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400 text-lg">Chargement...</div>}>
        <Header />
        <main className="flex-1 flex overflow-hidden">
          {/* Configuration Panel - Collapsible on mobile, fixed on desktop */}
          <div className={
            `${showConfigPanel ? 'block' : 'hidden'} \
            lg:block lg:w-80 xl:w-96 \
            absolute lg:relative z-40 lg:z-auto\
            inset-0 lg:inset-auto\
            bg-gray-50 lg:bg-transparent`
          }>
            <div className="h-full flex flex-col bg-gray-50 shadow-lg lg:shadow-none border-r border-gray-200">
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {/* Upload Image Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center my-2">
                    <div className="flex-grow h-px bg-gray-300" />
                    <span className="mx-3 text-base font-semibold text-gray-800"> Upload Image </span>
                    <div className="flex-grow h-px bg-gray-300" />
                  </div>
                  <div className="w-full flex justify-center">
                    <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                      <Suspense fallback={<div className="text-gray-400 text-center">Chargement du composant...</div>}>
                        <ImageUpload onImageSelect={handleImageSelect} imagePreviewUrl={imagePreviewUrl} hideLabel />
                      </Suspense>
                    </div>
                  </div>
                </div>

                {/* Component Type Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center my-2">
                    <div className="flex-grow h-px bg-gray-300" />
                    <span className="mx-3 text-base font-semibold text-gray-800"> Component Type </span>
                    <div className="flex-grow h-px bg-gray-300" />
                  </div>
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
                        <Icon 
                          name={COMPONENT_TYPE_ICONS[type]} 
                          className={`text-lg mb-1 transition-colors ${componentType === type ? 'text-primary' : 'text-gray-400'}`}
                        />
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
                  <div className="flex items-center justify-center my-2">
                    <div className="flex-grow h-px bg-gray-300" />
                    <span className="mx-3 text-base font-semibold text-gray-800"> Advanced Options </span>
                    <div className="flex-grow h-px bg-gray-300" />
                  </div>
                  <div className="space-y-2">
                    {(Object.keys(advancedOptions) as Array<keyof AdvancedOptions>).map(key => (
                      <label key={key} className="flex items-center text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={advancedOptions[key]}
                          onChange={(e) => setAdvancedOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary mr-3"
                        />
                        {key === 'javascript' ? 'Functional JavaScript' : key.replace(/([A-Z])/g, ' $1')}
                      </label>
                    ))}
                    <label className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={useCustomPrompt}
                        onChange={() => setUseCustomPrompt((v: boolean) => !v)}
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
                  onClick={handleReset}
                  className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-colors mb-2"
                >
                  <Icon name="fas fa-redo" className="mr-2" />
                  Reset All
                </button>
                <button
                  onClick={isLoading ? handleStop : handleSubmit}
                  disabled={
                    (useCustomPrompt && !customPrompt.trim()) ||
                    (!useCustomPrompt && (!selectedImageFile && !imagePreviewUrl))
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
                    <Suspense fallback={null}>
                      <Icon name="fas fa-spinner fa-spin" className="mr-2" />
                    </Suspense>
                    Generating...
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsCodeViewActive(!isCodeViewActive)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    isCodeViewActive 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  <Suspense fallback={null}>
                    <Icon name={isCodeViewActive ? "fas fa-eye" : "fas fa-code"} className="mr-1.5" />
                  </Suspense>
                  {isCodeViewActive ? 'Preview' : 'Code'}
                </button>
              </div>
            </div>

            {/* Results Content */}
            <div className="flex-1 relative overflow-hidden">
              {isCodeViewActive ? (
                <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400">Chargement du code...</div>}>
                  <CodePanel 
                    className="absolute inset-0"
                    code={generatedCodeForDisplay}
                    isLoading={isLoading && !generatedCodeForDisplay}
                    isFullscreen={isCodeFullscreen}
                    onToggleFullscreen={() => setIsCodeFullscreen(!isCodeFullscreen)}
                    editable={true}
                    onCodeChange={setGeneratedCodeForDisplay}
                    onRestore={() => setGeneratedCodeForDisplay(generatedHtml || '')}
                    canRestore={!!generatedHtml && generatedCodeForDisplay !== generatedHtml}
                  />
                </Suspense>
              ) : (
                <Suspense fallback={<div className="flex items-center justify-center h-full text-gray-400">Chargement de l'aperçu...</div>}>
                  <PreviewPanel 
                    className="absolute inset-0"
                    htmlContent={
                      generatedCodeForDisplay && generatedCodeForDisplay !== generatedHtml
                        ? generatedCodeForDisplay
                        : generatedHtml
                    }
                    isFullscreen={isPreviewFullscreen}
                    onToggleFullscreen={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                    isLoading={isLoading && !generatedHtml}
                  />
                </Suspense>
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
      </Suspense>
    </div>
  );
}

export default App;