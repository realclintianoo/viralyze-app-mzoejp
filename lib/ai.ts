
import OpenAI from 'openai';
import { Platform } from 'react-native';
import { OnboardingData } from '../types';

// Import polyfills for React Native
import 'react-native-url-polyfill/auto';

const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Initialize OpenAI client with proper configuration for React Native
let openai: OpenAI | null = null;
let initializationError: string | null = null;

const PLACEHOLDER_VALUES = [
  'your_openai_api_key_here',
  'REPLACE_WITH_YOUR_ACTUAL_OPENAI_API_KEY',
  'sk-your-api-key-here',
  'your-api-key-here'
];

if (!openaiApiKey) {
  initializationError = 'OpenAI API key not found in environment variables';
  console.log('❌ OpenAI API key not found in environment variables');
} else if (PLACEHOLDER_VALUES.includes(openaiApiKey)) {
  initializationError = 'OpenAI API key is still set to placeholder value';
  console.log('❌ OpenAI API key is still set to placeholder value:', openaiApiKey);
} else if (!openaiApiKey.startsWith('sk-')) {
  initializationError = 'OpenAI API key format appears invalid (should start with sk-)';
  console.log('❌ OpenAI API key format appears invalid:', openaiApiKey.substring(0, 10) + '...');
} else {
  try {
    openai = new OpenAI({
      apiKey: openaiApiKey,
      dangerouslyAllowBrowser: true, // Required for React Native
      baseURL: 'https://api.openai.com/v1', // Explicit base URL
    });
    console.log('✅ OpenAI client initialized successfully with key:', openaiApiKey.substring(0, 7) + '...');
  } catch (error) {
    initializationError = `Failed to initialize OpenAI client: ${error}`;
    console.error('❌ Failed to initialize OpenAI client:', error);
  }
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
  
  console.log('🤖 AI Complete called:', { 
    kind, 
    input: input.substring(0, 100) + '...', 
    hasApiKey: !!openaiApiKey,
    apiKeyValid: !PLACEHOLDER_VALUES.includes(openaiApiKey || ''),
    platform: Platform.OS,
    clientInitialized: !!openai,
    initializationError
  });
  
  // Enhanced validation with specific error messages
  if (initializationError) {
    console.error('❌ OpenAI initialization error:', initializationError);
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.\n\nSteps to fix:\n1. Go to https://platform.openai.com/api-keys\n2. Create a new API key\n3. Add it to your .env file\n4. Restart the app');
    } else if (PLACEHOLDER_VALUES.includes(openaiApiKey)) {
      throw new Error('OpenAI API key is still set to placeholder value. Please replace it with your actual API key from https://platform.openai.com/api-keys\n\nCurrent value: ' + openaiApiKey + '\n\nSteps to fix:\n1. Go to https://platform.openai.com/api-keys\n2. Create a new API key\n3. Replace the placeholder in your .env file\n4. Restart the app');
    } else {
      throw new Error(initializationError);
    }
  }
  
  if (!openai) {
    throw new Error('OpenAI client not initialized. Please check your API key and restart the app.');
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
    console.log('📡 Making OpenAI API request...');
    const startTime = Date.now();
    
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
      let chunkCount = 0;
      
      for await (const chunk of stream) {
        if (signal?.aborted) {
          console.log('🛑 Request cancelled by user');
          throw new Error('Request was cancelled');
        }
        
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          chunkCount++;
          onChunk?.(content);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Streaming completed: ${fullContent.length} chars, ${chunkCount} chunks, ${duration}ms`);
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

      const duration = Date.now() - startTime;
      const results = response.choices.map((choice) => choice.message.content || '');
      console.log(`✅ Non-streaming response: ${response.choices?.length} choices, ${duration}ms`);
      console.log(`📝 First response preview: ${results[0]?.substring(0, 100)}...`);
      
      return results;
    }
  } catch (error: any) {
    console.error('❌ AI completion error:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
    });
    
    if (error.name === 'AbortError' || error.message?.includes('cancelled')) {
      throw error;
    }
    
    // Handle specific OpenAI errors with user-friendly messages
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your API key in the .env file and ensure it\'s correct.\n\nSteps to fix:\n1. Go to https://platform.openai.com/api-keys\n2. Verify your API key is correct\n3. Make sure billing is set up\n4. Replace the key in your .env file\n5. Restart the app');
    } else if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later or upgrade your OpenAI plan.\n\nThis could mean:\n- You\'ve exceeded your free tier limits\n- You need to add billing to your OpenAI account\n- You\'re making requests too quickly');
    } else if (error.status === 500) {
      throw new Error('OpenAI API server error. Please try again later.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.message?.includes('browser-like environment')) {
      throw new Error('OpenAI configuration error. Please restart the app and try again.');
    } else if (error.message?.includes('insufficient_quota')) {
      throw new Error('OpenAI API quota exceeded. Please add billing information to your OpenAI account at https://platform.openai.com/account/billing');
    } else {
      throw new Error(`Failed to generate content: ${error.message || 'Unknown error'}. Please try again.`);
    }
  }
};

export const aiImage = async (options: { prompt: string; size?: '1024x1024' | '1792x1024' | '1024x1792' }): Promise<string> => {
  const { prompt, size = '1024x1024' } = options;
  
  console.log('🎨 AI Image called:', { 
    prompt: prompt.substring(0, 100) + '...', 
    size, 
    hasApiKey: !!openaiApiKey,
    apiKeyValid: !PLACEHOLDER_VALUES.includes(openaiApiKey || ''),
    platform: Platform.OS,
    clientInitialized: !!openai,
    initializationError
  });
  
  // Enhanced validation with specific error messages
  if (initializationError) {
    console.error('❌ OpenAI initialization error:', initializationError);
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.\n\nSteps to fix:\n1. Go to https://platform.openai.com/api-keys\n2. Create a new API key\n3. Add it to your .env file\n4. Restart the app');
    } else if (PLACEHOLDER_VALUES.includes(openaiApiKey)) {
      throw new Error('OpenAI API key is still set to placeholder value. Please replace it with your actual API key from https://platform.openai.com/api-keys\n\nCurrent value: ' + openaiApiKey + '\n\nSteps to fix:\n1. Go to https://platform.openai.com/api-keys\n2. Create a new API key\n3. Replace the placeholder in your .env file\n4. Restart the app');
    } else {
      throw new Error(initializationError);
    }
  }
  
  if (!openai) {
    throw new Error('OpenAI client not initialized. Please check your API key and restart the app.');
  }

  try {
    console.log('🖼️ Making OpenAI image generation request...');
    const startTime = Date.now();
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      size,
      quality: 'standard',
      n: 1,
    });

    const duration = Date.now() - startTime;
    const imageUrl = response.data[0].url || '';
    console.log(`✅ Image generation completed: ${duration}ms, URL: ${imageUrl.substring(0, 50)}...`);
    
    return imageUrl;
  } catch (error: any) {
    console.error('❌ AI image generation error:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code,
    });
    
    // Handle specific OpenAI errors with user-friendly messages
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your API key in the .env file and ensure it\'s correct.\n\nSteps to fix:\n1. Go to https://platform.openai.com/api-keys\n2. Verify your API key is correct\n3. Make sure billing is set up\n4. Replace the key in your .env file\n5. Restart the app');
    } else if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again later or upgrade your OpenAI plan.\n\nThis could mean:\n- You\'ve exceeded your free tier limits\n- You need to add billing to your OpenAI account\n- You\'re making requests too quickly');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.message?.includes('browser-like environment')) {
      throw new Error('OpenAI configuration error. Please restart the app and try again.');
    } else if (error.message?.includes('insufficient_quota')) {
      throw new Error('OpenAI API quota exceeded. Please add billing information to your OpenAI account at https://platform.openai.com/account/billing');
    } else if (error.message?.includes('content_policy_violation')) {
      throw new Error('Image prompt violates OpenAI content policy. Please try a different prompt.');
    } else {
      throw new Error(`Failed to generate image: ${error.message || 'Unknown error'}. Please try again.`);
    }
  }
};

// Check if OpenAI is configured
export const checkOpenAIConfig = () => {
  const hasApiKey = !!openaiApiKey;
  const isValidKey = !PLACEHOLDER_VALUES.includes(openaiApiKey || '');
  const isConfigured = hasApiKey && isValidKey && !!openai && !initializationError;
  
  console.log('🔍 OpenAI Config Check:', {
    hasApiKey,
    isValidKey,
    isConfigured,
    platform: Platform.OS,
    keyPreview: openaiApiKey ? `${openaiApiKey.substring(0, 7)}...` : 'none',
    initializationError
  });
  
  return {
    hasApiKey,
    isValidKey,
    isConfigured,
    platform: Platform.OS,
    initializationError
  };
};
