import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Define types for context data
interface DebugContext {
    console?: string[];
    error?: string[];
    fetch?: {
        url: string;
        method: string;
        status?: number;
        statusText?: string;
        [key: string]: unknown;
    }[];
}

// Gemini 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { message, context } = await req.json();

        // 컨텍스트 처리 및 요약
        const processedContext = processContext(context);

        // Gemini 모델 설정
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro" // 또는 "gemini-1.0-pro" 등 원하는 모델
        });

        // Gemini API 호출
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `You are a debugging assistant that helps analyze errors and provide solutions based on console logs, error messages, and network requests.
                            
${message}

Context:
${processedContext}`
                        }
                    ]
                }
            ],
            generationConfig: {
                maxOutputTokens: 1024,
            }
        });

        const response = result.response;
        return NextResponse.json({ response: response.text() });
    } catch (error: Error | unknown) {
        console.error('MCP API 오류:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// 컨텍스트 데이터 처리 및 요약 함수 (기존 코드 유지)
function processContext(context: DebugContext | undefined): string {
    if (!context) return "No context provided";

    try {
        // 컨텍스트 크기 제한 및 필터링
        const result = {
            console: (context.console || []).slice(-10), // 최근 10개 로그만 포함
            error: context.error || [],
            fetch: (context.fetch || []).slice(-5), // 최근 5개 요청만 포함
        };

        return JSON.stringify(result, null, 2);
    } catch (e: Error | unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        return "Error processing context: " + errorMessage;
    }
}
