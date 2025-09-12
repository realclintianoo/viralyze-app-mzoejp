
import { OnboardingData } from '../types';

// Mock AI functions for now - these would connect to actual AI services
export const aiComplete = async (
  kind: string,
  profile: OnboardingData | null,
  input: string
): Promise<string> => {
  console.log('AI Complete called:', { kind, profile, input });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const responses = {
    hook: [
      "Stop scrolling if you want to grow faster",
      "This mistake is killing your engagement",
      "I tried this for 30 days and here's what happened",
      "The algorithm change nobody is talking about",
      "Why your content isn't going viral (and how to fix it)"
    ],
    script: `Hook: "Stop scrolling if you want to grow faster"

Value: Here's the thing most creators don't realize - consistency beats perfection every single time. I've been analyzing top creators for months, and the ones who post regularly (even if it's not perfect) always outperform those who post sporadically.

The algorithm rewards consistency because it shows you're committed. Your audience starts expecting your content, and that anticipation drives engagement.

CTA: Follow for more growth tips that actually work. What's your biggest content struggle? Drop it below! 👇`,
    caption: `🚀 Ready to level up your content game?

Here's what I learned after analyzing 1000+ viral posts:

✨ Authenticity beats perfection
📈 Consistency is your secret weapon  
💡 Value first, promotion second
🎯 Know your audience inside out

The creators who understand this are the ones dominating their niches right now.

What's your biggest content challenge? Let me know below! 👇

#ContentCreator #SocialMediaTips #CreatorEconomy`,
    calendar: `📅 7-Day Content Calendar

Monday: Motivational Monday - Share your weekly goals
Tuesday: Tutorial Tuesday - Teach something valuable  
Wednesday: Behind the scenes - Show your process
Thursday: Throwback Thursday - Share your journey
Friday: Feature Friday - Highlight community/clients
Saturday: Saturday Stories - Personal/lifestyle content
Sunday: Sunday Reflection - Weekly wins and lessons

Best posting times for your niche:
- Morning: 7-9 AM
- Lunch: 12-1 PM  
- Evening: 6-8 PM`,
    rewrite: `Platform Adaptations:

📱 TikTok: "POV: You finally understand why your content isn't viral (it's not what you think)"

📸 Instagram: "The harsh truth about why your posts aren't getting engagement ✨ Swipe for the solution that changed everything →"

🎥 YouTube: "Why 99% of Creators Fail (And the Simple Fix That Changes Everything)"

🐦 X/Twitter: "Unpopular opinion: Your content isn't bad. Your strategy is. Here's what actually works in 2024:"

💼 LinkedIn: "After analyzing 10,000+ posts, I discovered the #1 reason most professional content fails. Here's what successful creators do differently:"`
  };
  
  return responses[kind as keyof typeof responses] || responses.hook[0];
};

export const aiImage = async (prompt: string, size: string): Promise<string> => {
  console.log('AI Image called:', { prompt, size });
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a placeholder image URL
  const dimensions = size === '16:9' ? '1920x1080' : size === '4:5' ? '1080x1350' : '1080x1080';
  return `https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=${dimensions.split('x')[0]}&h=${dimensions.split('x')[1]}&fit=crop&crop=center`;
};
