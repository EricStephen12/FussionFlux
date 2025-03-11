import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Template } from '@/types/template';
import { ApolloContact } from '@/services/apollo';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { template, contact } = await request.json();

    if (!template || !contact) {
      return NextResponse.json(
        { error: 'Template and contact are required' },
        { status: 400 }
      );
    }

    // Calculate lead score
    const leadScorePrompt = `
      Score this lead (0-100) based on:
      Title: ${contact.title}
      Industry: ${contact.industry}
      Company: ${contact.company}
      
      Consider:
      1. Decision making power
      2. Industry fit
      3. Company profile
      4. Engagement potential
      
      Return only the numeric score.
    `;

    const leadScoreCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: leadScorePrompt }],
      temperature: 0.3,
    });

    const leadScore = parseInt(leadScoreCompletion.choices[0].message.content);

    // Optimize email content
    const optimizationPrompt = `
      Optimize this email template for maximum engagement.
      
      Contact Profile:
      - Industry: ${contact.industry}
      - Title: ${contact.title}
      - Company: ${contact.company}
      
      Template Content:
      ${JSON.stringify(template.blocks, null, 2)}
      
      Provide:
      1. Optimized content maintaining the same block structure
      2. Subject line suggestions
      3. Personalization recommendations
      4. Best send time recommendation
    `;

    const contentCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: optimizationPrompt }],
      temperature: 0.7,
    });

    const aiSuggestions = JSON.parse(contentCompletion.choices[0].message.content);

    // Apply optimizations to template
    const optimizedTemplate = {
      ...template,
      blocks: template.blocks.map(block => ({
        ...block,
        content: {
          ...block.content,
          ...aiSuggestions.content
        }
      }))
    };

    // Calculate content score
    const contentScore = template.blocks.reduce((score, block) => {
      if (block.content.title) score += 0.1;
      if (block.content.subtitle) score += 0.1;
      if (block.content.imageUrl) score += 0.15;
      if (block.content.button) score += 0.15;
      return score;
    }, 0);

    const metrics = {
      leadScore,
      contentScore: Math.min(contentScore, 1),
      sendTimeScore: 0.85,
      recommendations: aiSuggestions.recommendations || [],
      optimizationDate: new Date().toISOString()
    };

    return NextResponse.json({
      optimizedTemplate,
      metrics
    });
  } catch (error) {
    console.error('AI optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize email' },
      { status: 500 }
    );
  }
} 