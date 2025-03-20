// @ts-nocheck
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { verifyAuth } from '@/utils/auth-server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const session = await verifyAuth(token);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, type, context } = await request.json();

    if (!text || !type) {
      return NextResponse.json(
        { error: 'Text and type are required' },
        { status: 400 }
      );
    }

    // Generate system message based on type and context
    const systemMessage = `You are an expert copywriter specializing in ${type} optimization for email marketing.
    Your task is to optimize the given text for maximum engagement while maintaining the original intent.
    Consider the following context: ${JSON.stringify(context)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: text }
      ],
      temperature: 0.7,
      n: 3, // Generate 3 alternatives
    });

    // Parse the response and extract alternatives
    const alternatives = completion.choices.map(choice => choice.message.content);

    // Generate specific suggestions
    const suggestionsCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an expert copywriter. Analyze the text and provide specific suggestions for improvement." },
        { role: "user", content: text }
      ],
      temperature: 0.5,
    });

    // Calculate engagement score
    const scoreCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Score the following text for engagement potential from 0-100. Return only the numeric score." },
        { role: "user", content: alternatives[0] }
      ],
      temperature: 0.3,
    });

    const score = parseInt(scoreCompletion.choices[0].message.content || "0");

    return NextResponse.json({
      optimizedText: alternatives[0],
      alternatives: alternatives.slice(1),
      score,
      suggestions: suggestionsCompletion.choices[0].message.content?.split('\n').filter(Boolean) || []
    });
  } catch (error) {
    console.error('Error in text optimization:', error);
    return NextResponse.json(
      { error: 'Failed to optimize text' },
      { status: 500 }
    );
  }
} 