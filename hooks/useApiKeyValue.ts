// hooks/useApiKeyValue.ts
// Hook pour obtenir la clé API valide (environnement ou locale)
import { useEffect, useState } from 'react';
import { apiKeyService } from '../services/apiKeyService';

export function useApiKeyValue() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    const updateKey = () => {
      apiKeyService.getValidApiKey().then(key => {
        if (mounted) setApiKey(key);
      });
    };
    updateKey();
    window.addEventListener('apiKeyChanged', updateKey);
    return () => {
      mounted = false;
      window.removeEventListener('apiKeyChanged', updateKey);
    };
  }, []);
  return apiKey;
}
