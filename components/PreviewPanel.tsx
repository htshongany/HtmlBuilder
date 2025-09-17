import React from 'react';
import Icon from './Icon';

interface PreviewPanelProps {
  htmlContent: string | null;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isLoading: boolean;
  className?: string;
  onShowDocs: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ htmlContent, isFullscreen, onToggleFullscreen, isLoading, className, onShowDocs }) => {
  const renderDefaultContent = () => (
    <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 opacity-80 select-none">
      <i className="fas fa-question-circle text-5xl mb-2"></i>
      <span className="text-lg mb-2">No preview yet.</span>
      <button 
        onClick={onShowDocs}
        className="inline-block px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded transition-colors duration-200 shadow"
      >
        How to get an API Key?
      </button>
    </div>
  );

  const contentToRender = isLoading
    ? `<div class="flex flex-col items-center justify-center h-full text-gray-500 p-4">
         <i class="fas fa-spinner fa-spin text-4xl mb-3 text-primary animate-spin"></i>
         <p class="text-lg animate-pulse">Generating preview...</p>
       </div>`
    : (!htmlContent || htmlContent.trim() === '');

  // Base classes for the panel itself (when not fullscreen)
  const panelBaseClasses = "flex flex-col h-full";

  // Classes for the content viewing area
  // Fullscreen takes over the screen
  const viewAreaClasses = isFullscreen
    ? "fixed inset-0 z-[100] bg-white p-4 overflow-auto custom-scrollbar"
    : "preview-container-bg border border-gray-200 flex-grow overflow-auto custom-scrollbar p-2 md:p-4";


  if (isFullscreen) {
    return (
      <div className={viewAreaClasses}>
         <button
          onClick={onToggleFullscreen}
          className="absolute top-4 right-4 z-[101] p-2 rounded-lg bg-transparent hover:bg-gray-200 transition text-gray-600 hover:text-primary"
          aria-label="Exit fullscreen"
        >
          <Icon name="fas fa-compress" />
        </button>
        {contentToRender 
          ? <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: isLoading ? contentToRender : '' }} />
          : <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: htmlContent || '' }} />
        }
        {!htmlContent && !isLoading && renderDefaultContent()}
      </div>
    );
  }

  return (
    <div className={`${className || ''} ${panelBaseClasses}`}>
      <div className="flex justify-between items-center mb-2 p-2"> {/* Reduced padding and margin for header */}
        <h3 className="font-semibold text-base text-gray-800">Preview</h3>
        <button
          onClick={onToggleFullscreen}
          className="p-1.5 bg-transparent hover:bg-gray-200 transition text-gray-500 hover:text-primary text-xs"
          aria-label="Enter fullscreen"
        >
          <Icon name="fas fa-expand" />
        </button>
      </div>
      <div className={viewAreaClasses}>
        {contentToRender 
          ? renderDefaultContent()
          : <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: htmlContent || '' }} />
        }
      </div>
    </div>
  );
};

export default PreviewPanel;
