
import OpenAI from 'openai';
import { OnboardingData } from '../types';

const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Initialize OpenAI client
let openai: OpenAI | null = null;
if (openaiApiKey) {
  openai = new OpenAI({
    apiKey: openaiApiKey,
  });
}

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
  
  if (!openaiApiKey || !openai) {
    console.error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file');
    throw new Error('OpenAI API key not configured. Please check your environment variables in Settings → API Configuration.');
  }

  const systemPrompt = `You are an expert social media growth coach. Tailor your outputs to the user's profile and create engaging, platform-appropriate content.

User Profile:
- Platforms: ${profile?.platforms?.join(', ') || 'General'}
- Niche: ${profile?.niche || 'General'}
- Followers: ${profile?.followers ? `${profile.followers.toLocaleString()}` : '0'}
- Goal: ${profile?.goal || 'Growth'}

Guidelines:
- For scripts: Create 30-60 second content with Hook → Value → CTA structure. Include suggested posting times.
- For hooks: Create compelling opening lines under 12 words that grab attention immediately.
- For captions: Match the platform style, include relevant hashtags, and maintain brand voice.
- For calendars: Provide 7-day content plans with specific posting schedules and content types.
- For rewrites: Adapt content for different platforms while maintaining the core message.
- Always include a clear call-to-action and suggest optimal posting times when relevant.
- Keep content authentic, engaging, and tailored to the user's niche and follower count.`;

  const userPrompt = `Create ${kind} content: ${input}`;

  try {
    console.log('Making OpenAI API request...');
    
    if (stream) {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          onChunk?.(content);
        }
      }

      console.log('Streaming completed, full content length:', fullContent.length);
      return [fullContent];
    } else {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        n,
        temperature: 0.7,
        max_tokens: 1000,
      });

      console.log('Non-streaming response received, choices:', response.choices?.length);
      return response.choices.map((choice) => choice.message.content || '');
    }
  } catch (error: any) {
    console.error('AI completion error:', error);
    
    if (error.name === 'AbortError') {
      throw error;
    }
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your API key in Settings → API Configuration.');
    } else if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later or upgrade your OpenAI plan.');
    } else if (error.status === 500) {
      throw new Error('OpenAI API server error. Please try again later.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error('Failed to generate content. Please try again.');
    }
  }
};

export const aiImage = async (options: { prompt: string; size?: '1024x1024' | '1792x1024' | '1024x1792' }): Promise<string> => {
  const { prompt, size = '1024x1024' } = options;
  
  console.log('AI Image called with:', { prompt, size, hasApiKey: !!openaiApiKey });
  
  if (!openaiApiKey || !openai) {
    console.error('OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file');
    throw new Error('OpenAI API key not configured. Please check your environment variables in Settings → API Configuration.');
  }

  try {
    console.log('Making OpenAI image generation request...');
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size,
      quality: 'standard',
      n: 1,
    });

    console.log('Image generation completed successfully');
    return response.data[0].url || '';
  } catch (error: any) {
    console.error('AI image generation error:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your API key in Settings → API Configuration.');
    } else if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later or upgrade your OpenAI plan.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else {
      throw new Error('Failed to generate image. Please try again.');
    }
  }
};

// Check if OpenAI is configured
export const checkOpenAIConfig = () => {
  return {
    hasApiKey: !!openaiApiKey,
    isConfigured: !!openaiApiKey && !!openai
  };
};
