
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
  
  console.log('AI Complete called with:', { kind, input, hasApiKey: !!openaiApiKey });
  
  if (!openaiApiKey) {
    console.error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file');
    throw new Error('OpenAI API key not configured. Please check your environment variables.');
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
    console.log('Making OpenAI API request...');
    
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

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else if (response.status === 500) {
        throw new Error('OpenAI API server error. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }
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

      console.log('Streaming completed, full content length:', fullContent.length);
      return [fullContent];
    } else {
      const data = await response.json();
      console.log('Non-streaming response received, choices:', data.choices?.length);
      return data.choices.map((choice: any) => choice.message.content);
    }
  } catch (error: any) {
    console.error('AI completion error:', error);
    
    if (error.name === 'AbortError') {
      throw error;
    }
    
    // Re-throw with more specific error messages
    if (error.message.includes('API key')) {
      throw error;
    } else if (error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error('Failed to generate content. Please try again.');
    }
  }
};

export const aiImage = async (prompt: string, size: '1024x1024' | '1792x1024' | '1024x1792' = '1024x1024'): Promise<string> => {
  console.log('AI Image called with:', { prompt, size, hasApiKey: !!openaiApiKey });
  
  if (!openaiApiKey) {
    console.error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file');
    throw new Error('OpenAI API key not configured. Please check your environment variables.');
  }

  try {
    console.log('Making OpenAI image generation request...');
    
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

    console.log('OpenAI image API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI image API error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('Image generation completed successfully');
    return data.data[0].url;
  } catch (error: any) {
    console.error('AI image generation error:', error);
    
    if (error.message.includes('API key')) {
      throw error;
    } else if (error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error('Failed to generate image. Please try again.');
    }
  }
};
