
import { OnboardingData } from '../types';

// Mock AI function for development
// In production, this would integrate with OpenAI or similar service
export async function aiComplete(
  kind: string,
  profile: OnboardingData | null,
  input: string
): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Mock responses based on kind and input
  const responses = {
    chat: [
      `Great question! Based on your ${profile?.niche || 'content'} niche, here's what I'd suggest: ${generateMockResponse(input)}`,
      `I love this direction! For ${profile?.platforms?.join(' and ') || 'your platforms'}, you could try: ${generateMockResponse(input)}`,
      `This is perfect for your audience! Here's a strategy that works well: ${generateMockResponse(input)}`,
    ],
    script: [
      "🎬 HOOK: Did you know that 90% of people quit before they see results?\n\n💡 VALUE: The secret isn't talent - it's consistency. Here's the 3-step system I use:\n\n1. Start with just 5 minutes daily\n2. Track your progress visually\n3. Celebrate small wins\n\n🚀 CTA: Try this for 7 days and watch what happens. Comment 'READY' if you're in!",
      "🔥 HOOK: Everyone's talking about this 'weird' morning routine...\n\n✨ VALUE: It's not what you think. No ice baths or 4AM wake-ups. Just 3 simple habits that changed everything:\n\n• 2-minute gratitude practice\n• Phone-free first hour\n• One deep conversation daily\n\n💪 CTA: Which one will you try first? Let me know below!",
    ],
    hook: [
      "• You're doing social media wrong (and here's why)\n• The #1 mistake killing your engagement\n• Why your content isn't converting\n• This changed everything for me\n• What nobody tells you about going viral\n• The secret successful creators won't share\n• Stop doing this immediately\n• Your audience is begging for this\n• This took me from 0 to 100K\n• The uncomfortable truth about growth",
    ],
  };

  const categoryResponses = responses[kind as keyof typeof responses] || responses.chat;
  const randomResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  
  return randomResponse;
}

export async function aiImage(prompt: string, size: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  
  // Return a placeholder image URL
  const width = size === '16:9' ? 1920 : size === '4:5' ? 1080 : 1080;
  const height = size === '16:9' ? 1080 : size === '4:5' ? 1350 : 1080;
  
  return `https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=${width}&h=${height}&fit=crop&crop=center`;
}

function generateMockResponse(input: string): string {
  const templates = [
    "Focus on storytelling - people connect with authentic experiences more than perfect content.",
    "Try the 80/20 rule: 80% value-driven content, 20% promotional. This builds trust first.",
    "Consistency beats perfection. Post regularly, even if it's not your best work.",
    "Engage genuinely with your audience. Reply to comments like you're talking to a friend.",
    "Use trending audio but make the content uniquely yours. Don't just copy what's viral.",
    "Share behind-the-scenes content. People love seeing the real person behind the brand.",
    "Ask questions in your captions to boost engagement. Make your audience part of the conversation.",
    "Collaborate with others in your niche. Cross-pollination grows everyone's audience.",
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
}
