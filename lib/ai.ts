
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

const getPersonalizedSystemPrompt = (profile: OnboardingData | null, kind: string): string => {
  let basePrompt = `You are an expert social media growth coach and content creator. You provide actionable, specific advice tailored to each creator's unique situation.`;
  
  if (profile) {
    const { niche, followers, goal, platforms } = profile;
    
    // Format follower count for context
    const followerText = followers >= 1000000 
      ? `${(followers / 1000000).toFixed(1)}M` 
      : followers >= 1000 
        ? `${(followers / 1000).toFixed(1)}K` 
        : followers.toString();
    
    // Determine follower tier for appropriate advice
    let tierAdvice = '';
    if (followers < 1000) {
      tierAdvice = 'Focus on consistency, trending hashtags, and engaging with your community to grow your initial audience.';
    } else if (followers < 10000) {
      tierAdvice = 'Leverage your growing audience with community engagement, collaborations, and consistent quality content.';
    } else if (followers < 100000) {
      tierAdvice = 'Consider monetization opportunities, exclusive content, and building deeper relationships with your audience.';
    } else {
      tierAdvice = 'Focus on brand partnerships, premium content offerings, and scaling your influence across platforms.';
    }
    
    basePrompt += `

CREATOR PROFILE:
- Niche: ${niche} creator
- Audience: ${followerText} followers
- Platforms: ${platforms?.join(', ') || 'Multi-platform'}
- Goal: ${goal}
- Tier Strategy: ${tierAdvice}

PERSONALIZATION GUIDELINES:
- Always reference their ${niche} niche naturally in responses
- Tailor examples and suggestions to ${niche} content
- Consider their ${followerText} follower count when suggesting strategies
- Align advice with their goal: "${goal}"
- Use platform-specific advice for: ${platforms?.join(', ') || 'general platforms'}`;
  }

  // Add kind-specific instructions
  switch (kind) {
    case 'hooks':
      basePrompt += `

HOOK GENERATION RULES:
- Create attention-grabbing opening lines under 12 words
- Make them specific to ${profile?.niche || 'general'} content
- Use psychological triggers (curiosity, urgency, controversy, benefit)
- Include numbers, questions, or bold statements when relevant
- Ensure they're platform-appropriate for ${profile?.platforms?.join('/') || 'social media'}`;
      break;
      
    case 'scripts':
      basePrompt += `

SCRIPT STRUCTURE (30-60 seconds):
1. HOOK (0-3s): Grab attention immediately
2. VALUE (3-45s): Deliver core content/teaching
3. CTA (45-60s): Clear call-to-action
- Tailor language and examples to ${profile?.niche || 'general'} audience
- Include suggested posting times and platform optimizations`;
      break;
      
    case 'captions':
      basePrompt += `

CAPTION GUIDELINES:
- Match the tone and style of ${profile?.niche || 'general'} content
- Include relevant hashtags for ${profile?.niche || 'general'} niche
- Vary between educational, entertaining, and engaging styles
- Include clear calls-to-action appropriate for ${profile?.followers || 0} follower audience`;
      break;
      
    case 'calendar':
      basePrompt += `

CONTENT CALENDAR REQUIREMENTS:
- Create 7-day posting schedule
- Mix content types appropriate for ${profile?.niche || 'general'} creators
- Include optimal posting times for ${profile?.platforms?.join('/') || 'social platforms'}
- Balance educational, entertaining, and promotional content
- Consider ${profile?.followers || 0} follower engagement patterns`;
      break;
      
    case 'rewriter':
      basePrompt += `

PLATFORM ADAPTATION RULES:
- Adapt content for different platform audiences and formats
- Maintain core message while optimizing for each platform's style
- Consider character limits, hashtag strategies, and engagement patterns
- Tailor for ${profile?.niche || 'general'} audience across platforms`;
      break;
      
    case 'chat':
      basePrompt += `

CONVERSATION GUIDELINES:
- Provide specific, actionable advice for ${profile?.niche || 'content'} creators
- Reference their follower count (${profile?.followers || 0}) when giving growth strategies
- Ask clarifying questions when needed to provide better advice
- Share relevant examples from ${profile?.niche || 'general'} industry
- Keep responses conversational but professional`;
      break;
  }

  basePrompt += `

RESPONSE STYLE:
- Be encouraging and motivational
- Provide specific, actionable steps
- Use examples relevant to their niche and follower level
- Keep advice practical and implementable
- Reference current social media trends when relevant`;

  return basePrompt;
};

export const aiComplete = async (options: AICompletionOptions): Promise<string[]> => {
  const { kind, profile, input, n = 3, stream = false, onChunk, signal } = options;
  
  console.log('🤖 AI Complete called:', { 
    kind, 
    input: input.substring(0, 100) + '...', 
    hasProfile: !!profile,
    niche: profile?.niche,
    followers: profile?.followers,
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

  const systemPrompt = getPersonalizedSystemPrompt(profile, kind);
  const userPrompt = input;

  try {
    console.log('📡 Making personalized OpenAI API request...');
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
      console.log(`✅ Personalized streaming completed: ${fullContent.length} chars, ${chunkCount} chunks, ${duration}ms`);
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
      console.log(`✅ Personalized response: ${response.choices?.length} choices, ${duration}ms`);
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
