/// <reference types="openai" />
import OpenAI from "openai";
import { NextResponse } from "next/server";

interface Module {
  id: string;
  title: string;
  tags: string[];
  shortDesc: string;
  imageUrl?: string;
}

interface AIResponse {
  easyModules: string[];
  mediumModules: string[];
  hardModules: string[];
  optionalModules: string[];
  explanations: {
    difficulty_choices: string;
    optional_modules: string;
  };
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { profile, availableModules } = await request.json();

    const systemMessage = `You are an AI tutor specializing in astronomy education. Your task is to analyze a student's profile and create a personalized learning path.

The learning system works as follows:
1. You must ONLY use modules from this list: ${JSON.stringify(
      availableModules.map((m: Module) => m.id)
    )}
2. Each module should be placed in EITHER easy, medium, or hard arrays
3. A module cannot appear in both the learning path AND optionalModules
4. optionalModules can be empty if all modules are appropriate for the user
5. Each module should appear exactly once, either in a difficulty array OR in optionalModules
6. Do not invent or create new module IDs

Consider these factors:
- Age: Adapt content difficulty (children vs. students vs. adults)
- Education Level: From elementary to post-graduate
- Prior Knowledge: Both astronomy-specific and general science
- Learning Goals: Whether academic, professional, or hobby
- Learning Preferences: Different teaching approaches
- Known Subjects: To avoid redundant content

Available modules: ${JSON.stringify(availableModules)}

Respond only with a JSON object in this format:
{
  "easyModules": ["existing moduleIds only"],
  "mediumModules": ["existing moduleIds only"],
  "hardModules": ["existing moduleIds only"],
  "optionalModules": ["existing moduleIds only, can be empty"],
  "explanations": {
    "difficulty_choices": "Brief explanation of why modules were assigned to their difficulty levels",
    "optional_modules": "Brief explanation of why certain modules were marked as optional"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: JSON.stringify(profile),
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No response from OpenAI");

    const parsedResponse = JSON.parse(content);

    // Convertir tous les IDs de modules en numéros (int) si possible
    const convertToNumbers = (arr: string[]) =>
      arr.map((id) => (isNaN(Number(id)) ? id : Number(id)));
    const easyModules = convertToNumbers(parsedResponse.easyModules || []);
    const mediumModules = convertToNumbers(parsedResponse.mediumModules || []);
    const hardModules = convertToNumbers(parsedResponse.hardModules || []);
    const optionalModules = convertToNumbers(
      parsedResponse.optionalModules || []
    );

    return NextResponse.json({
      ...parsedResponse,
      easyModules,
      mediumModules,
      hardModules,
      optionalModules,
    });
  } catch (error) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: "AI processing failed" },
      { status: 500 }
    );
  }
}
