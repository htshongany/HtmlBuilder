import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import hljs from 'highlight.js/lib/core';
import html from 'highlight.js/lib/languages/xml';
import CodeMirror from '@uiw/react-codemirror';
import { html as htmlLang } from '@codemirror/lang-html';
import { githubDark } from '@uiw/codemirror-theme-github';
// @ts-ignore
import 'highlight.js/styles/github-dark.css';
import '../css/custom-scrollbar.css';

hljs.registerLanguage('html', html);

interface CodePanelProps {
  code: string | null;
  isLoading: boolean;
  className?: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  editable?: boolean; // Ajout prop pour activer l'édition
  onCodeChange?: (newCode: string) => void; // Callback pour notifier le parent
  onRestore?: () => void; // Ajout prop pour restaurer le code généré
  canRestore?: boolean; // Affiche le bouton Restore si true
}

const CodePanel: React.FC<CodePanelProps> = ({ code, isLoading, className, isFullscreen, onToggleFullscreen, editable = false, onCodeChange, onRestore, canRestore }) => {
  const [copied, setCopied] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [dotStep, setDotStep] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState<string>("");
  const [fontSize, setFontSize] = useState(14); // Taille de police par défaut raisonnable

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

  const handleEditToggle = () => {
    if (isEditing) {
      // Save
      setIsEditing(false);
      if (onCodeChange) onCodeChange(editedCode);
    } else {
      // Enter edit mode
      setIsEditing(true);
      setEditedCode(code || "");
    }
  };

  const handleIncreaseFont = () => setFontSize((size) => Math.min(size + 2, 32));
  const handleDecreaseFont = () => setFontSize((size) => Math.max(size - 2, 10));

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col p-4">
        <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-700">
          <h3 className="font-semibold text-base text-slate-200">Generated Code</h3>
          <div>
            {/* Contrôles de taille de police en fullscreen */}
            <button
              onClick={handleDecreaseFont}
              className="p-1.5 mr-1 bg-transparent hover:bg-slate-600 transition text-slate-300 hover:text-white text-xs group"
              aria-label="Réduire la taille du texte"
              title="Réduire la taille du texte"
            >
              <Icon name="fas fa-minus" className="text-base group-hover:text-primary cursor-pointer transition-colors" />
            </button>
            <button
              onClick={handleIncreaseFont}
              className="p-1.5 mr-2 bg-transparent hover:bg-slate-600 transition text-slate-300 hover:text-white text-xs group"
              aria-label="Augmenter la taille du texte"
              title="Augmenter la taille du texte"
            >
              <Icon name="fas fa-plus" className="text-base group-hover:text-primary cursor-pointer transition-colors" />
            </button>
            {/* Bouton Edit en fullscreen */}
            {editable && !isEditing && (
              <button
                onClick={() => { setIsEditing(true); setEditedCode(code || ""); }}
                className="p-1.5 mr-2 bg-transparent text-slate-300 hover:bg-yellow-100 hover:text-yellow-700 transition text-xs"
                aria-label="Edit code"
                title="Edit"
              >
                <Icon name="fas fa-pen" className="text-base cursor-pointer transition-colors group-hover:text-primary" />
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleEditToggle}
                className="p-1.5 mr-2 hover:bg-green-200 transition text-slate-300 text-xs"
                aria-label="Save code"
                title="Save"
              >
                <Icon name="fas fa-check" className="text-base cursor-pointer transition-colors group-hover:text-green-600" />
              </button>
            )}
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 mr-2 bg-transparent text-gray-600 hover:bg-red-200 hover:text-red-600 transition text-xs"
                aria-label="Cancel editing"
                title="Cancel"
              >
                <Icon name="fas fa-times" className="text-base group-hover:text-red-500 cursor-pointer transition-colors" />
              </button>
            )}
            <button
              onClick={handleCopy}
              disabled={!code || isLoading}
              className="p-1.5 mr-2 bg-transparent hover:bg-slate-600 transition text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              aria-label="Copy code"
            >
              <Icon name={copied ? "fas fa-check" : "fas fa-copy"} className={`${copied ? "text-green-400" : ""} text-sm`} />
            </button>
            <button
              onClick={handleDownload}
              disabled={!code || isLoading}
              className="p-1.5 mr-2 bg-transparent hover:bg-slate-600 transition text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              aria-label="Download code"
            >
              <Icon name="fas fa-download" className="text-sm" />
            </button>
            {canRestore && onRestore && (
              <button
                onClick={onRestore}
                className="p-1.5 mr-2 bg-transparent hover:bg-slate-600 transition text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                aria-label="Restaurer le code généré"
                title="Restaurer le code généré par l'IA"
              >
                <Icon name="fas fa-undo" className="text-sm" />
              </button>
            )}
            <button
              onClick={onToggleFullscreen}
              className="p-1.5 bg-transparent hover:bg-slate-600 transition text-slate-300 hover:text-white text-xs"
              aria-label="Exit fullscreen"
            >
              <Icon name="fas fa-compress" className="text-sm"/>
            </button>
          </div>
        </div>
        {/* Mode édition en fullscreen */}
        <div className="flex-1 flex flex-col min-h-0 custom-scrollbar scrollbar-blue-theme" style={{ background: '#0f172a', color: '#e0e7ff' }}>
          {isEditing ? (
            <CodeMirror
              value={editedCode}
              height="100%"
              theme={githubDark}
              extensions={[htmlLang()]}
              onChange={(value: string) => setEditedCode(value)}
              basicSetup={{ lineNumbers: true, autocompletion: true }}
              className="flex-1 w-full font-mono border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary mb-2 custom-scrollbar scrollbar-blue-theme codemirror-scrollbar-thin"
              style={{ minHeight: 0, height: '100%', fontSize: fontSize, lineHeight: '1.3' }}
              autoFocus
            />
          ) : (
            <pre className="h-full overflow-auto p-3 text-xs flex-1 custom-scrollbar scrollbar-blue-theme" style={{ background: '#0f172a', color: '#e0e7ff', fontSize: fontSize, lineHeight: '1.3' }}><code className="language-html text-slate-200" dangerouslySetInnerHTML={{ __html: highlighted || codeToDisplay }} /></pre>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={`${className || ''} ${panelBaseClasses}`} style={{ minHeight: 0 }}>
      <div className="flex justify-between items-center mb-2 p-2">
        <h3 className="font-semibold text-base text-gray-800">Code (HTML & Tailwind)</h3>
        <div>
          {/* Contrôles de taille de police */}
          <button
            onClick={handleDecreaseFont}
            className="p-1.5 mr-1 bg-transparent hover:bg-gray-200 transition text-gray-500 text-xs group"
            aria-label="Réduire la taille du texte"
            title="Réduire la taille du texte"
          >
            <Icon name="fas fa-minus" className="text-base group-hover:text-primary cursor-pointer transition-colors" />
          </button>
          <button
            onClick={handleIncreaseFont}
            className="p-1.5 mr-2 bg-transparent hover:bg-gray-200 transition text-gray-500 text-xs group"
            aria-label="Augmenter la taille du texte"
            title="Augmenter la taille du texte"
          >
            <Icon name="fas fa-plus" className="text-base group-hover:text-primary cursor-pointer transition-colors" />
          </button>
          {/* Bouton Edit à côté de Copy, une seule fois */}
          {editable && (
            <>
              <button
                onClick={handleEditToggle}
                className={`p-1.5 mr-2 bg-transparent ${isEditing ? 'hover:bg-green-200' : ''} text-gray-600 transition text-xs group`}
                aria-label={isEditing ? 'Save code' : 'Edit code'}
                title={isEditing ? 'Save' : 'Edit'}
              >
                <Icon name={isEditing ? 'fas fa-check' : 'fas fa-pen'} className={`text-base cursor-pointer transition-colors ${isEditing ? 'text-green-700 group-hover:text-green-800' : 'group-hover:text-primary'}`} />
              </button>
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 mr-2 bg-transparent hover:bg-red-200 text-gray-600 hover:text-red-600 transition text-xs group"
                  aria-label="Cancel editing"
                  title="Cancel"
                >
                  <Icon name="fas fa-times" className="text-base group-hover:text-red-500 cursor-pointer transition-colors" />
                </button>
              )}
            </>
          )}
          <button
            onClick={handleCopy}
            disabled={!code || isLoading}
            className="p-1.5 mr-2 bg-transparent  transition text-gray-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            aria-label="Copy code"
          >
            <Icon name={copied ? "fas fa-check" : "fas fa-copy"} className={`${copied ? "text-green-500" : ""} text-sm`} />
          </button>
          <button
            onClick={handleDownload}
            disabled={!code || isLoading}
            className="p-1.5 mr-2 bg-transparent  transition text-gray-500 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            aria-label="Download code"
          >
            <Icon name="fas fa-download" className="text-sm" />
          </button>
          {canRestore && onRestore && (
            <button
              onClick={onRestore}
              className="p-1.5 mr-2 bg-transparent hover:bg-slate-600 transition text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs"
              aria-label="Restaurer le code généré"
              title="Restaurer le code généré par l'IA"
            >
              <Icon name="fas fa-undo" className="text-sm" />
            </button>
          )}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 bg-transparent  transition text-gray-500 hover:text-primary text-xs"
            aria-label="Enter fullscreen"
          >
            <Icon name="fas fa-expand" className="text-sm"/>
          </button>
        </div>
      </div>
      <div className={`${viewAreaBaseClasses} bg-slate-900 flex-1 flex flex-col min-h-0 custom-scrollbar scrollbar-blue-theme`} style={{ color: '#e0e7ff', background: '#0f172a' }}> 
        {isEditing ? (
          <CodeMirror
            value={editedCode}
            height="100%"
            theme={githubDark}
            extensions={[htmlLang()]}
            onChange={(value: string) => setEditedCode(value)}
            basicSetup={{ lineNumbers: true, autocompletion: true }}
            className="flex-1 w-full font-mono border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary mb-2 custom-scrollbar scrollbar-blue-theme codemirror-scrollbar-thin"
            style={{ minHeight: 0, height: '100%', fontSize: fontSize, lineHeight: '1.5', background: '#0f172a' }}
            autoFocus
          />
        ) : (
          <pre className="h-full overflow-auto p-3 flex-1 custom-scrollbar scrollbar-blue-theme" style={{ background: '#0f172a', color: '#e0e7ff', scrollbarColor: '#6366f1 #0f172a', fontSize: fontSize, lineHeight: '1.5' }}>
            <code className="language-html text-slate-200" style={{ background: 'transparent', color: '#e0e7ff', fontSize: fontSize, lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: highlighted || codeToDisplay }} />
          </pre>
        )}
      </div>
    </div>
  );
};

export default CodePanel;
