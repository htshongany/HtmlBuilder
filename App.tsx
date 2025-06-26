import React, { useState, useCallback, useEffect } from 'react';
import Icon from './components/Icon';
import ImageUpload from './components/ImageUpload';
import PreviewPanel from './components/PreviewPanel';
import CodePanel from './components/CodePanel';
import { generateHtmlFromImage } from './services/geminiService';
import { UploadOption, ComponentType, AdvancedOptions, GenerationParams, GroundingChunk } from './types';
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
  const [apiSources, setApiSources] = useState<GroundingChunk[] | null>(null);

  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState<boolean>(false);
  const [isCodeViewActive, setIsCodeViewActive] = useState<boolean>(false); // false = preview, true = code
  const [isCodeFullscreen, setIsCodeFullscreen] = useState<boolean>(false);
  
  // Ajout d'un état pour stopper la génération
  const [isStopped, setIsStopped] = useState<boolean>(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);

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
    setApiSources(null);
    setIsCodeViewActive(false);
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
    if (uploadOption === UploadOption.Basic && (!selectedImageFile || !imagePreviewUrl)) {
      setError('Please upload an image.');
      return;
    }
    if (uploadOption === UploadOption.CustomPrompt && !customPrompt.trim()) {
      setError('Custom prompt cannot be empty when "Upload with Custom Prompt" is selected.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setIsStopped(false);
    setGeneratedHtml(null); 
    setGeneratedCodeForDisplay(null);
    setApiSources(null);

    const generationParams: GenerationParams = {
      imageDataBase64: imagePreviewUrl || '',
      mimeType: (uploadOption === UploadOption.Basic && selectedImageFile) ? selectedImageFile.type : 'text/plain',
      customPromptText: customPrompt,
      componentType,
      advancedOptions,
    };

    // Utilisation d'un AbortController pour stopper la génération
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const {html, sources} = await generateHtmlFromImage(generationParams, abortController.signal);
      if (isStopped) return;
      setGeneratedHtml(html);
      setGeneratedCodeForDisplay(html); 
      setApiSources(sources);
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
    <header className="bg-white shadow-sm py-4 sticky top-0 z-50"> {/* Increased z-index for header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center sm:justify-start">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Icon name="fas fa-palette" className="text-primary mr-3" /> 
            AI Web Page Generator
          </h1>
        </div>
      </div>
    </header>
  );

  const Footer: React.FC = () => (
    <footer className="bg-white border-t border-gray-200 py-4 text-xs"> {/* Reduced padding for footer */}
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-500">
          <p>© {new Date().getFullYear()} AI Web Page Generator. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  const HeroSection: React.FC = () => (
    <section className="text-center mb-6"> {/* Reduced margin for hero */}
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Transform Images into Code</h2>
      <p className="text-md text-gray-600 max-w-xl mx-auto">
        Configure your generation options below and see the magic happen!
      </p>
    </section>
  );
  
  const RadioCard: React.FC<{
    id: string;
    value: UploadOption;
    currentValue: UploadOption;
    onChange: (value: UploadOption) => void;
    title: string;
    description: string;
  }> = ({ id, value, currentValue, onChange, title, description }) => (
    <label htmlFor={id} className={`flex items-start p-3 bg-gray-50 rounded-lg border-2 cursor-pointer transition-all duration-200 ease-in-out hover:border-primary/80 ${currentValue === value ? 'border-primary shadow-sm' : 'border-gray-200'}`}>
      <input 
        type="radio" 
        name="uploadType" 
        id={id} 
        value={value}
        checked={currentValue === value}
        onChange={() => onChange(value)}
        className="h-4 w-4 mt-1 text-primary custom-radio focus:ring-primary focus:ring-offset-0" 
      />
      <div className="ml-3 flex-1">
        <span className="block font-medium text-sm text-gray-800">{title}</span>
        <span className="block text-xs text-gray-600 mt-0.5">{description}</span>
      </div>
    </label>
  );

  const COMPONENTS_VISIBLE_INIT = 5;
  const [showAllComponents, setShowAllComponents] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <Header />
      {/* Main content area that will take remaining vertical space and scroll if its content overflows */}
      <main className="flex-grow container mx-auto px-4 py-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        <HeroSection />
        {/* Container for the input and results panels. It grows to fill 'main' and handles layout switching. */}
        <div className="flex-grow flex flex-col md:flex-row gap-6 md:overflow-hidden"> {/* md:overflow-hidden is important for side-by-side to constrain children */}
          {/* Left Column: Inputs - This column will scroll internally if its content is too long */}
          <div className="w-full md:w-2/5 lg:w-[40%] bg-white rounded-xl shadow-lg p-4 md:p-6 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
            {/* Form content directly here */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">1. Choose Your Method</h3>
              <div className="grid grid-cols-1 gap-3">
                  <RadioCard
                      id="basicUpload"
                      value={UploadOption.Basic}
                      currentValue={uploadOption}
                      onChange={setUploadOption}
                      title="Upload Image (Basic)"
                      description="Generate with default settings."
                  />
                  <RadioCard
                      id="customUpload"
                      value={UploadOption.CustomPrompt}
                      currentValue={uploadOption}
                      onChange={setUploadOption}
                      title="Upload with Custom Prompt"
                      description="Image & detailed instructions."
                  />
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-1">
              Upload a UI image, provide instructions, and let AI generate HTML with Tailwind CSS.
            </p>
            <ImageUpload onImageSelect={handleImageSelect} imagePreviewUrl={imagePreviewUrl} />

            {uploadOption === UploadOption.CustomPrompt && (
              <div>
                <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Custom Instructions (Be specific!)
                </label>
                <textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full h-28 p-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-shadow focus:shadow-sm text-sm"
                  placeholder="E.g., 'Hero section with centered title, subtitle, and primary CTA button. Dark blue background...'"
                />
                <p className="mt-1 text-xs text-gray-500">The more detailed your prompt, the better the result.</p>
              </div>
            )}
          
            <div className="flex items-center my-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="mx-3 text-gray-400 text-sm font-medium">2. Configure Output</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-2">Component Type</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(showAllComponents ? COMPONENT_TYPES_ARRAY : COMPONENT_TYPES_ARRAY.slice(0, COMPONENTS_VISIBLE_INIT)).map((type) => (
                    <button
                      key={type}
                      onClick={() => setComponentType(type)}
                      className={`py-2 px-1.5 bg-gray-100 rounded-md text-gray-700 transition flex flex-col items-center justify-center text-center component-btn-style ${componentType === type ? 'active-component-btn ring-1 ring-primary ring-offset-1' : 'hover:bg-gray-200'}`}
                    >
                      <Icon name={COMPONENT_TYPE_ICONS[type]} className="mb-0.5 text-lg" />
                      <span className="text-xs font-medium mt-0.5">{type}</span>
                    </button>
                  ))}
                  {!showAllComponents && COMPONENT_TYPES_ARRAY.length > COMPONENTS_VISIBLE_INIT && (
                    <button
                      onClick={() => setShowAllComponents(true)}
                      className="py-2 px-1.5 bg-gray-200 rounded-md text-gray-700 flex flex-col items-center justify-center text-center hover:bg-gray-300 transition"
                      aria-label="Show more components"
                    >
                      <Icon name="fas fa-ellipsis-h" className="mb-0.5 text-lg" />
                      <span className="text-xs font-medium mt-0.5">Voir plus</span>
                    </button>
                  )}
                  {showAllComponents && COMPONENT_TYPES_ARRAY.length > COMPONENTS_VISIBLE_INIT && (
                    <button
                      onClick={() => setShowAllComponents(false)}
                      className="py-2 px-1.5 bg-gray-200 rounded-md text-gray-700 flex flex-col items-center justify-center text-center hover:bg-gray-300 transition"
                      aria-label="Show less components"
                    >
                      <Icon name="fas fa-chevron-up" className="mb-0.5 text-lg" />
                      <span className="text-xs font-medium mt-0.5">Voir moins</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Advanced Options</label>
                  <div className="space-y-1.5">
                    {(Object.keys(advancedOptions) as Array<keyof AdvancedOptions>).map(key => {
                      let labelText = key.replace(/([A-Z])/g, ' $1'); // Add space before capitals
                      if (key === 'javascript') labelText = 'Functional JavaScript'; // Specific label for JS

                      return (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={advancedOptions[key]}
                            onChange={(e) => setAdvancedOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary custom-checkbox"
                          />
                          <span className="ml-2 text-xs text-gray-700 capitalize">{labelText}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {error && <p className="my-2 text-center text-red-600 bg-red-100 p-2.5 rounded-md text-sm">{error}</p>}
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm w-full sm:w-auto"
              >
                <Icon name="fas fa-redo mr-1.5" />Reset
              </button>
              <button
                onClick={isLoading ? handleStop : handleSubmit}
                disabled={
                  (uploadOption === UploadOption.Basic && (!selectedImageFile || !imagePreviewUrl)) ||
                  (uploadOption === UploadOption.CustomPrompt && !customPrompt.trim())
                }
                className={`px-6 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md text-sm w-full sm:w-auto ${isLoading ? 'bg-red-500 from-red-500 to-red-400' : ''}`}
              >
                <Icon name={isLoading ? "fas fa-stop mr-1.5" : "fas fa-bolt mr-1.5"} />
                {isLoading ? 'Stop' : 'Generate Code'}
              </button>
            </div>
          </div>

          {/* Right Column: Results - This panel is also constrained in height by its parent and handles internal scrolling */}
          <div id="resultsPanel" className="w-full md:w-3/5 lg:w-[60%] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden"> {/* overflow-hidden ensures children (header, content, sources) fit */}
            <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                {isLoading ? 'AI is Working...' : isCodeViewActive ? 'Generated Code' : 'Live Preview'}
              </h2>
              <button 
                onClick={() => setIsCodeViewActive(!isCodeViewActive)}
                className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-indigo-50 rounded-md transition-colors"
                aria-label={isCodeViewActive ? "Show Preview" : "Show Code"}
              >
                <Icon name={isCodeViewActive ? "fas fa-eye mr-1.5" : "fas fa-code mr-1.5"} />
                {isCodeViewActive ? 'Preview' : 'Code'}
              </button>
            </div>
            
            {/* Content Area for Preview or Code. It grows to fill available vertical space in #resultsPanel */}
            <div className="flex-grow p-1 relative overflow-hidden"> {/* PreviewPanel/CodePanel are absolute positioned inside this */}
              {isCodeViewActive ? (
                <CodePanel 
                  className="absolute inset-0" // Fills the parent div
                  code={generatedCodeForDisplay}
                  isLoading={isLoading && !generatedCodeForDisplay}
                  isFullscreen={isCodeFullscreen}
                  onToggleFullscreen={() => setIsCodeFullscreen(!isCodeFullscreen)}
                />
              ) : (
                <PreviewPanel 
                  className="absolute inset-0" // Fills the parent div
                  htmlContent={generatedHtml} 
                  isFullscreen={isPreviewFullscreen} 
                  onToggleFullscreen={() => setIsPreviewFullscreen(!isPreviewFullscreen)}
                  isLoading={isLoading && !generatedHtml}
                />
              )}
            </div>

            {apiSources && apiSources.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 max-h-24 overflow-y-auto custom-scrollbar"> {/* Max height and scroll for sources */}
                <h3 className="text-xs font-semibold text-gray-700 mb-1">Sources:</h3>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  {apiSources.map((source, index) => (
                    <li key={index}>
                      <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {source.web.title || source.web.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
