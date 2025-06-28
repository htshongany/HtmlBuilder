// hooks/useApiKeyManager.ts
// Hook React pour exposer la gestion de la clé API Gemini

import { useState, useEffect, useCallback } from 'react';
import { apiKeyService } from '../services/apiKeyService';

export function useApiKeyManager() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialisation : recherche d'une clé valide
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiKeyService.getValidApiKey()
      .then(key => {
        if (mounted) setApiKey(key);
      })
      .catch(() => {
        if (mounted) setApiKey(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  // Ajout/remplacement de clé API utilisateur
  const setUserApiKey = useCallback(async (key: string) => {
    setLoading(true);
    setError(null);
    const ok = await apiKeyService.storeUserApiKey(key);
    if (ok) {
      setApiKey(key);
    } else {
      setError('Clé API invalide.');
    }
    setLoading(false);
    return ok;
  }, []);

  // Suppression de la clé API utilisateur
  const removeUserApiKey = useCallback(() => {
    apiKeyService.removeLocalApiKey();
    setApiKey(null);
  }, []);

  return {
    apiKey,
    loading,
    error,
    setUserApiKey,
    removeUserApiKey,
    hasValidApiKey: !!apiKey,
  };
}
