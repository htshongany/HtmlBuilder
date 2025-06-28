// services/validateApiKey.ts
// Validation de la clé API Gemini (retourne true si valide, false sinon)

export async function validateApiKey(apiKey: string): Promise<boolean> {
  // Appel d'une requête de test Gemini (endpoint public ou dummy)
  // Ici, on simule une requête fetch sur l'API Gemini (à adapter selon l'API réelle)
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: { 'x-goog-api-key': apiKey },
    });
    // 200 ou 401/403 selon validité
    return response.ok;
  } catch {
    return false;
  }
}
