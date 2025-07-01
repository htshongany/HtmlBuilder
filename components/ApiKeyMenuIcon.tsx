// components/ApiKeyMenuIcon.tsx
// Icône clé API dans le menu principal avec popup pour gestion de la clé

import React, { useState, useEffect } from 'react';
import { useApiKeyManager } from '../hooks/useApiKeyManager';

// Icône clé SVG inline cohérente avec le style du site
const KeyIcon = ({ className = '' }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 8.5C13.5 11.5376 11.0376 14 8 14C4.96243 14 2.5 11.5376 2.5 8.5C2.5 5.46243 4.96243 3 8 3C11.0376 3 13.5 5.46243 13.5 8.5Z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="8" cy="8.5" r="1.5" fill="currentColor"/>
    <rect x="13" y="8" width="6" height="3" rx="1.5" fill="currentColor"/>
  </svg>
);

const ApiKeyMenuIcon: React.FC = () => {
  const { hasValidApiKey, setUserApiKey, removeUserApiKey, error, loading } = useApiKeyManager();
  const [showModal, setShowModal] = useState(false);
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Vérifie si une clé d'environnement VITE_GEMINI_API_KEY est présente et valide
  // Correction pour Vite : utiliser import.meta.env (qui existe dans Vite, mais TS peut râler)
  const envApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;
  const [envApiKeyValid, setEnvApiKeyValid] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkEnvKey() {
      if (envApiKey) {
        const { validateApiKey } = await import('../services/validateApiKey');
        const valid = await validateApiKey(envApiKey);
        if (mounted) setEnvApiKeyValid(valid);
      } else {
        setEnvApiKeyValid(false);
      }
    }
    checkEnvKey();
    return () => { mounted = false; };
  }, [envApiKey]);

  // Correction : l'icône ne doit être visible que si aucune clé d'environnement valide n'est trouvée
  // Elle doit rester visible même si une clé locale (navigateur) est présente
  const [shouldShowIcon, setShouldShowIcon] = useState(false);
  useEffect(() => {
    // Affiche l'icône uniquement si aucune clé d'environnement valide
    if (envApiKeyValid === null) return; // attente validation
    setShouldShowIcon(!envApiKeyValid);
  }, [envApiKeyValid]);
  if (!shouldShowIcon) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const ok = await setUserApiKey(input);
    if (ok) {
      setInput('');
      // Ne pas fermer la popup, l'UI va afficher l'état "clé enregistrée"
    } else {
      setLocalError('Clé API invalide.');
    }
  };

  const handleRemove = () => {
    removeUserApiKey();
    setInput('');
    setLocalError(null);
    // Ne pas fermer la popup, l'UI va afficher le formulaire
  };

  return (
    <>
      <div className="relative group" style={{ display: 'inline-block' }}>
        <button
          className={`ml-6 text-xl focus:outline-none transition-colors duration-150 ${hasValidApiKey ? 'text-green-600 hover:text-green-700' : 'text-gray-500 hover:text-primary'}`}
          onClick={() => setShowModal(true)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', pointerEvents: 'auto' }}
        >
          <KeyIcon className="w-5 h-5" />
        </button>
        {/* Custom tooltip (white background, black text) */}
        <div className="hidden group-hover:block absolute left-8 top-1/2 -translate-y-1/2 bg-white border border-gray-300 rounded shadow-md px-4 py-2 text-xs text-gray-800 w-64 z-30 animate-fade-in pointer-events-none" style={{ minWidth: 180 }}>
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-gray-300 border-l-0" />
          {hasValidApiKey ? (
            <span className="font-semibold text-gray-800">Your Gemini API key is valid.</span>
          ) : (
            <>
              <span className="font-semibold text-gray-800">Configure your Gemini API key.</span>
              <br />
              <span>Required for code generation.</span>
            </>
          )}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-0 w-full max-w-md relative border border-gray-200 animate-fade-in">
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-800">Clé API Gemini</h2>
                <button
                  className="text-gray-400 hover:text-gray-700 text-xl rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                  onClick={() => setShowModal(false)}
                  aria-label="Fermer"
                  style={{ lineHeight: 1 }}
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              <div className="px-6 py-7">
                {hasValidApiKey ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="mb-2 text-green-700 bg-green-50 rounded-lg px-3 py-2 text-base flex items-center gap-2">
                      <KeyIcon className="w-5 h-5 text-green-600" />
                      <span className="tracking-widest select-none">{'Clé enregistrée dans le navigateur'}</span>
                    </div>
                    <div className="flex gap-2 w-full">
                      <button
                        className="flex-1 bg-gray-100 text-gray-700 rounded-lg px-3 py-2 hover:bg-gray-200 border border-gray-200 transition-colors"
                        onClick={() => setShowModal(false)}
                      >Fermer</button>
                      <button
                        className="flex-1 bg-red-50 text-red-700 rounded-lg px-3 py-2 hover:bg-red-100 border border-red-200 transition-colors"
                        onClick={handleRemove}
                      >Supprimer</button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                      type="password"
                      placeholder="Entrer votre clé Gemini API"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary text-gray-800 bg-gray-50 text-base"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-primary text-white rounded-lg px-3 py-2 hover:bg-primary-dark disabled:opacity-50 transition-colors text-base"
                        disabled={loading}
                      >Valider</button>
                      <button
                        type="button"
                        className="flex-1 bg-gray-100 text-gray-700 rounded-lg px-3 py-2 hover:bg-gray-200 border border-gray-200 transition-colors text-base"
                        onClick={() => setShowModal(false)}
                      >Annuler</button>
                    </div>
                    {(error || localError) && <div className="text-red-600 text-sm text-center">{error || localError}</div>}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiKeyMenuIcon;
