
import { OnboardingData } from '../types';

const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export interface AICompletionOptions {
  kind: string;
  profile: OnboardingData | null;
  input: string;
  n?: number;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

export const aiComplete = async (options: AICompletionOptions): Promise<string[]> => {
  const { kind, profile, input, n = 3, stream = false, onChunk, signal } = options;
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are an expert social media growth coach. Tailor your outputs to the user's niche, follower count, and goals. 

User Profile:
- Platforms: ${profile?.platforms?.join(', ') || 'General'}
- Niche: ${profile?.niche || 'General'}
- Followers: ${profile?.followers || 0}
- Goal: ${profile?.goal || 'Growth'}

For scripts: Create 30-60 second content with Hook → Value → CTA structure. Include optimal posting times.
For hooks: Create compelling opening lines under 12 words.
For captions: Match the platform style and include relevant hashtags.
For calendars: Provide 7-day content plans with posting schedules.
For rewrites: Adapt content for different platforms while maintaining core message.`;

  const userPrompt = `Create ${kind} content: ${input}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        n: stream ? 1 : n,
        stream,
        temperature: 0.7,
        max_tokens: 1000,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    if (stream) {
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let fullContent = '';
      const decoder = new TextDecoder();
      let isStreamActive = true;

      while (isStreamActive) {
        const { done, value } = await reader.read();
        if (done) {
          isStreamActive = false;
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              isStreamActive = false;
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk?.(content);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
              console.log('Parsing error for chunk:', e);
            }
          }
        }
      }

      return [fullContent];
    } else {
      const data = await response.json();
      return data.choices.map((choice: any) => choice.message.content);
    }
  } catch (error) {
    console.error('AI completion error:', error);
    throw error;
  }
};

export const aiImage = async (prompt: string, size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'): Promise<string> => {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        size,
        quality: 'standard',
        n: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('AI image generation error:', error);
    throw error;
  }
};
