import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert email copywriter. Your task is to optimize the given text to be more engaging, persuasive, and professional while maintaining its core message."
        },
        {
          role: "user",
          content: `Please optimize this text for an email: "${text}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const optimizedText = completion.choices[0]?.message?.content || text;

    return NextResponse.json({ optimizedText });
  } catch (error) {
    console.error('Error optimizing text:', error);
    return NextResponse.json(
      { error: 'Failed to optimize text' },
      { status: 500 }
    );
  }
} 