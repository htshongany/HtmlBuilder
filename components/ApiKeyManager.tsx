// components/ApiKeyManager.tsx
// Composant UI pour la gestion de la clé API Gemini

import React, { useState } from 'react';
import { useApiKeyManager } from '../hooks/useApiKeyManager';

const ApiKeyManager: React.FC = () => {
  const { loading, error, setUserApiKey, removeUserApiKey, hasValidApiKey } = useApiKeyManager();
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  if (loading) return <div>Chargement de la clé API…</div>;

  return (
    <div className="api-key-manager">
      {hasValidApiKey ? (
        <div>
          <span>Clé API valide utilisée.</span>
          <button onClick={removeUserApiKey}>Supprimer la clé API</button>
        </div>
      ) : (
        <div>
          {showInput ? (
            <form onSubmit={async e => { e.preventDefault(); await setUserApiKey(input); }}>
              <input
                type="password"
                placeholder="Entrer votre clé Gemini API"
                value={input}
                onChange={e => setInput(e.target.value)}
                autoFocus
              />
              <button type="submit">Valider</button>
              <button type="button" onClick={() => setShowInput(false)}>Annuler</button>
              {error && <div style={{ color: 'red' }}>{error}</div>}
            </form>
          ) : (
            <button onClick={() => setShowInput(true)}>
              <span role="img" aria-label="clé">🔑</span> Ajouter une clé API
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;
