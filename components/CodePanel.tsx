import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import hljs from 'highlight.js/lib/core';
import html from 'highlight.js/lib/languages/xml';
// @ts-ignore
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('html', html);

interface CodePanelProps {
  code: string | null;
  isLoading: boolean;
  className?: string; // Added className prop
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const CodePanel: React.FC<CodePanelProps> = ({ code, isLoading, className, isFullscreen, onToggleFullscreen }) => {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [dotStep, setDotStep] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setDotStep((prev) => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    } else {
      setDotStep(0);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && code) {
      setHighlighted(hljs.highlight(code, { language: 'html' }).value);
    } else {
      setHighlighted(null);
    }
  }, [code, isLoading]);

  const handleCopy = async () => {
    if (!code || isLoading) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
       try {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed'; 
        textArea.style.opacity = '0'; 
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy method failed: ', fallbackErr);
        alert("Failed to copy code. Please copy manually.");
      }
    }
  };

  const handleDownload = () => {
    if (!code || isLoading) return;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  const animatedDots = ['.', '..', '...', '.'];
  const codeToDisplay = isLoading ? 
    `// Generating code${animatedDots[dotStep]}\n<div class=\"flex items-center justify-center h-full\">\n  <span class=\"animate-spin\"><i class=\"fas fa-spinner text-2xl text-indigo-300\"></i></span>\n</div>` 
    : (code || '// No code generated yet.');

  const panelBaseClasses = "flex flex-col h-full";

  const viewAreaBaseClasses = "code-block-container flex-grow overflow-hidden"; // Ensure pre can scroll within this

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col p-4">
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
          <h3 className="font-semibold text-base text-slate-200">Generated Code</h3>
          <div>
            <button
              onClick={handleCopy}
              disabled={!code || isLoading}
              className="p-1.5 mr-2 rounded-md bg-slate-700 hover:bg-slate-600 transition text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              aria-label="Copy code"
            >
              <Icon name={copied ? "fas fa-check" : "fas fa-copy"} className={`${copied ? "text-green-400" : ""} text-sm`} />
            </button>
            <button
              onClick={handleDownload}
              disabled={!code || isLoading}
              className="p-1.5 mr-2 rounded-md bg-slate-700 hover:bg-slate-600 transition text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              aria-label="Download code"
            >
              <Icon name="fas fa-download" className="text-sm" />
            </button>
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 transition text-slate-300 hover:text-white text-xs"
              aria-label="Exit fullscreen"
            >
              <Icon name="fas fa-compress" className="text-sm"/>
            </button>
          </div>
        </div>
        <pre className="h-full overflow-auto text-sm"><code className="language-html text-slate-200" dangerouslySetInnerHTML={{ __html: highlighted || codeToDisplay }} /></pre>
      </div>
    );
  }
  
  return (
    <div className={`${className || ''} ${panelBaseClasses}`}>
      <div className="flex justify-between items-center mb-2 p-2"> {/* Panel header in normal view */}
        <h3 className="font-semibold text-base text-gray-800">Code (HTML & Tailwind)</h3>
        <div>
          <button
            onClick={handleCopy}
            disabled={!code || isLoading}
            className="p-1.5 mr-2 rounded-md bg-gray-100 hover:bg-gray-200 transition text-gray-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            aria-label="Copy code"
          >
            <Icon name={copied ? "fas fa-check" : "fas fa-copy"} className={`${copied ? "text-green-500" : ""} text-sm`} />
          </button>
          <button
            onClick={handleDownload}
            disabled={!code || isLoading}
            className="p-1.5 mr-2 rounded-md bg-gray-100 hover:bg-gray-200 transition text-gray-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            aria-label="Download code"
          >
            <Icon name="fas fa-download" className="text-sm" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 transition text-gray-500 hover:text-primary text-xs"
            aria-label="Enter fullscreen"
          >
            <Icon name="fas fa-expand" className="text-sm"/>
          </button>
        </div>
      </div>
      <div className={`${viewAreaBaseClasses} bg-slate-800 rounded-xl`}>
         <pre className="h-full overflow-auto p-3 text-sm"><code className="language-html text-slate-200" dangerouslySetInnerHTML={{ __html: highlighted || codeToDisplay }} /></pre>
      </div>
    </div>
  );
};

export default CodePanel;
