import axios from 'axios';
import { cacheService } from '@/utils/cache';

interface OptimizationResult {
  subject: string;
  score: number;
  improvements: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface EmailMetrics {
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

class AIOptimizationService {
  private readonly CACHE_TTL = 3600; // 1 hour

  async optimizeSubjectLine(subject: string, niche: string): Promise<OptimizationResult> {
    const cacheKey = `subject_optimization:${subject}:${niche}`;
    
    try {
      // Check cache first
      const cached = await cacheService.get<OptimizationResult>(cacheKey);
      if (cached) return cached;

      // Use OpenAI API for optimization
      const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in email marketing optimization for e-commerce.'
            },
            {
              role: 'user',
              content: `Optimize this email subject line for ${niche} niche: "${subject}"`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result: OptimizationResult = {
        subject: response.data.choices[0].message.content,
        score: this.calculateOptimizationScore(response.data.choices[0].message.content),
        improvements: this.analyzeImprovements(subject, response.data.choices[0].message.content),
        sentiment: this.analyzeSentiment(response.data.choices[0].message.content)
      };

      // Cache the result
      await cacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error optimizing subject line:', error);
      return {
        subject: subject,
        score: 0,
        improvements: ['Failed to optimize subject line'],
        sentiment: 'neutral'
      };
    }
  }

  async optimizeEmailContent(content: string, metrics: EmailMetrics): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an expert in email marketing optimization. Current metrics:
                Open Rate: ${metrics.openRate}%
                Click Rate: ${metrics.clickRate}%
                Conversion Rate: ${metrics.conversionRate}%`
            },
            {
              role: 'user',
              content: `Optimize this email content for better engagement: "${content}"`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error optimizing email content:', error);
      return content;
    }
  }

  async generateProductDescription(
    product: { name: string; price: number; features: string[] }
  ): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert e-commerce copywriter.'
            },
            {
              role: 'user',
              content: `Write a compelling product description for:
                Name: ${product.name}
                Price: $${product.price}
                Features: ${product.features.join(', ')}`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating product description:', error);
      return `${product.name} - $${product.price}`;
    }
  }

  async generateEmailCopyVariation(content: string, niche: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in email marketing copywriting for e-commerce.'
            },
            {
              role: 'user',
              content: `Generate a variation of this email content for the ${niche} niche: "${content}"`
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating email copy variation:', error);
      return content;
    }
  }

  private calculateOptimizationScore(subject: string): number {
    let score = 0;
    
    // Length optimization (ideal length 30-60 characters)
    const length = subject.length;
    if (length >= 30 && length <= 60) score += 0.3;
    
    // Personalization
    if (subject.includes('{first_name}')) score += 0.1;
    
    // Urgency words
    const urgencyWords = ['limited', 'now', 'today', 'exclusive', 'only'];
    if (urgencyWords.some(word => subject.toLowerCase().includes(word))) score += 0.2;
    
    // Question mark
    if (subject.includes('?')) score += 0.1;
    
    // Numbers
    if (/\d/.test(subject)) score += 0.1;
    
    // Emoji presence (but not too many)
    const emojiCount = (subject.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount === 1) score += 0.1;
    if (emojiCount === 2) score += 0.05;
    
    return Math.min(score, 1);
  }

  private analyzeImprovements(original: string, optimized: string): string[] {
    const improvements: string[] = [];
    
    if (optimized.length !== original.length) {
      improvements.push('Adjusted length for better readability');
    }
    
    if (optimized.includes('{first_name}') && !original.includes('{first_name}')) {
      improvements.push('Added personalization');
    }
    
    if (/\d/.test(optimized) && !/\d/.test(original)) {
      improvements.push('Added numerical values for better engagement');
    }
    
    if (optimized.includes('?') && !original.includes('?')) {
      improvements.push('Added question format to increase curiosity');
    }
    
    return improvements;
  }

  private analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['amazing', 'awesome', 'great', 'exclusive', 'special', 'best'];
    const negativeWords = ['limited', 'last', 'end', 'never', 'problem', 'issue'];
    
    const words = text.toLowerCase().split(' ');
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }
}

export const aiOptimizationService = new AIOptimizationService();
export type { OptimizationResult, EmailMetrics }; 