
import { OnboardingData } from '../types';
import { aiComplete as libAiComplete, aiImage as libAiImage } from '../lib/ai';

// Legacy wrapper functions for backward compatibility
export const aiComplete = async (
  kind: string,
  profile: OnboardingData | null,
  input: string,
  n: number = 3
): Promise<string> => {
  try {
    const results = await libAiComplete({
      kind,
      profile,
      input,
      n,
    });
    return results[0] || '';
  } catch (error) {
    console.error('AI completion error:', error);
    throw error;
  }
};

export const aiImage = async (prompt: string, size: string): Promise<string> => {
  try {
    // Map size formats
    const sizeMap: { [key: string]: '1024x1024' | '1792x1024' | '1024x1792' } = {
      '16:9': '1792x1024',
      '4:5': '1024x1792',
      '1:1': '1024x1024',
      '1024x1024': '1024x1024',
      '1792x1024': '1792x1024',
      '1024x1792': '1024x1792',
    };

    const mappedSize = sizeMap[size] || '1024x1024';
    return await libAiImage(prompt, mappedSize);
  } catch (error) {
    console.error('AI image generation error:', error);
    throw error;
  }
};

// Export the new functions as well
export { aiComplete as aiCompleteNew, aiImage as aiImageNew } from '../lib/ai';
