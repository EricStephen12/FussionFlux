import { useState, useCallback } from 'react';

export const useAI = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeText = useCallback(async (text: string): Promise<string> => {
    setIsOptimizing(true);
    setError(null);
    try {
      // Make API call to AI service (e.g., OpenAI)
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize text');
      }

      const data = await response.json();
      return data.optimizedText;
    } catch (err) {
      setError('Failed to optimize text');
      throw err;
    } finally {
      setIsOptimizing(false);
    }
  }, []);

  return {
    optimizeText,
    isOptimizing,
    error,
  };
}; 