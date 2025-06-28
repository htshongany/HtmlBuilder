// hooks/useApiKeyValue.ts
// Hook pour obtenir la clé API valide (environnement ou locale)
import { useEffect, useState } from 'react';
import { apiKeyService } from '../services/apiKeyService';

export function useApiKeyValue() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    apiKeyService.getValidApiKey().then(key => {
      if (mounted) setApiKey(key);
    });
    return () => { mounted = false; };
  }, []);
  return apiKey;
}
