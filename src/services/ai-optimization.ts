import axios from 'axios';
import { cacheService } from '@/utils/cache';
import { ApolloContact } from '@/services/apollo';
import { Template, BlockContent } from '@/types/template';
import { firestoreService } from '@/services/firestore';

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

export interface AIOptimizationMetrics {
  leadScore: number;
  contentScore: number;
  sendTimeScore: number;
  recommendations: string[];
  optimizationDate: string;
}

interface TextOptimizationParams {
  text: string;
  type: 'title' | 'description' | 'quote' | 'button' | 'feature';
  context?: {
    industry?: string;
    tone?: 'professional' | 'casual' | 'friendly' | 'formal';
    purpose?: string;
    targetAudience?: string;
  };
}

interface TextOptimizationResult {
  optimizedText: string;
  alternatives: string[];
  score: number;
  suggestions: string[];
}

export class AIOptimizationService {
  private readonly CACHE_TTL = 3600; // 1 hour

  async optimizeSubjectLine(subject: string, niche: string): Promise<OptimizationResult> {
    const cacheKey = `subject_optimization:${subject}:${niche}`;
    
    try {
      // Check cache first
      const cached = await cacheService.get<OptimizationResult>(cacheKey);
      if (cached) return cached;

      // Use API route for optimization
      const response = await axios.post('/api/ai/optimize', {
        text: subject,
        type: 'subject',
        niche
      });

      const optimizedSubject = response.data.optimizedText;

      const result: OptimizationResult = {
        subject: optimizedSubject,
        score: this.calculateOptimizationScore(optimizedSubject),
        improvements: this.analyzeImprovements(subject, optimizedSubject),
        sentiment: this.analyzeSentiment(optimizedSubject)
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

  async optimizeEmailContent(template: Template, contact: ApolloContact): Promise<{
    optimizedTemplate: Template;
    metrics: AIOptimizationMetrics;
  }> {
    try {
      const response = await axios.post('/api/ai/optimize-email', {
        template,
        contact
      });

      return response.data;
    } catch (error) {
      console.error('AI optimization error:', error);
      throw error;
    }
  }

  async generateProductDescription(
    product: { name: string; price: number; features: string[] }
  ): Promise<string> {
    try {
      const response = await axios.post('/api/ai/optimize', {
        text: `${product.name}\n${product.features.join('\n')}`,
        type: 'product',
        context: {
          price: product.price,
          features: product.features
        }
      });

      return response.data.optimizedText;
    } catch (error) {
      console.error('Error generating product description:', error);
      return `${product.name} - $${product.price}`;
    }
  }

  async generateEmailCopyVariation(content: string, niche: string): Promise<string> {
    try {
      const response = await axios.post('/api/ai/optimize', {
        text: content,
        type: 'variation',
        niche
      });

      return response.data.optimizedText;
    } catch (error) {
      console.error('Error generating email copy variation:', error);
      return content;
    }
  }

  async optimizeBlockText(params: TextOptimizationParams): Promise<TextOptimizationResult> {
    const cacheKey = `block_text_optimization:${params.text}:${params.type}:${JSON.stringify(params.context)}`;
    
    try {
      // Check cache first
      const cached = await cacheService.get<TextOptimizationResult>(cacheKey);
      if (cached) return cached;

      const prompt = this.generateOptimizationPrompt(params);
      
      const response = await axios.post('/api/ai/optimize-text', {
        text: params.text,
        type: params.type,
        context: params.context
      });

      const result: TextOptimizationResult = {
        optimizedText: response.data.optimizedText,
        alternatives: response.data.alternatives || [],
        score: response.data.score || 0,
        suggestions: response.data.suggestions || []
      };

      // Cache the result
      await cacheService.set(cacheKey, result, this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error optimizing block text:', error);
      return {
        optimizedText: params.text,
        alternatives: [],
        score: 0,
        suggestions: ['Failed to optimize text']
      };
    }
  }

  private generateOptimizationPrompt(params: TextOptimizationParams): string {
    const contextInfo = params.context ? `
      Industry: ${params.context.industry || 'General'}
      Tone: ${params.context.tone || 'professional'}
      Purpose: ${params.context.purpose || 'Not specified'}
      Target Audience: ${params.context.targetAudience || 'General'}
    ` : '';

    const typeSpecificInstructions = {
      title: 'Create a compelling, concise headline that grabs attention',
      description: 'Write clear, engaging copy that explains the value proposition',
      quote: 'Create an authentic, impactful testimonial or quote',
      button: 'Write action-oriented, clickable button text',
      feature: 'Highlight key benefits and features in a compelling way'
    };

    return `
      Optimize the following ${params.type} text for maximum engagement:

      Original Text:
      ${params.text}

      Context:
      ${contextInfo}

      Instructions:
      ${typeSpecificInstructions[params.type]}

      Please provide:
      1. Optimized version
      2. 2-3 alternative versions
      3. Improvement suggestions
      4. Engagement score (0-100)
    `;
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
export type { OptimizationResult, EmailMetrics, AIOptimizationMetrics }; 