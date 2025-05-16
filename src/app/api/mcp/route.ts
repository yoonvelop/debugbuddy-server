import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { message, context } = await req.json();

        // 컨텍스트 처리 및 요약
        const processedContext = processContext(context);

        // OpenAI API 호출
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // 저렴한 모델 사용
            messages: [
                {
                    role: "system",
                    content: "You are a debugging assistant that helps analyze errors and provide solutions based on console logs, error messages, and network requests."
                },
                {
                    role: "user",
                    content: `${message}\n\nContext:\n${processedContext}`
                }
            ],
            max_tokens: 500 // 토큰 제한으로 비용 절감
        });

        return NextResponse.json({ response: completion.choices[0].message.content });
    } catch (error: any) {
        console.error('MCP API 오류:', error);
        return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
    }
}

// 컨텍스트 데이터 처리 및 요약 함수
function processContext(context: any): string {
    if (!context) return "No context provided";

    try {
        // 컨텍스트 크기 제한 및 필터링
        const result = {
            console: (context.console || []).slice(-10), // 최근 10개 로그만 포함
            error: context.error || [],
            fetch: (context.fetch || []).slice(-5), // 최근 5개 요청만 포함
        };

        return JSON.stringify(result, null, 2);
    } catch (e: any) {
        return "Error processing context: " + (e.message || 'Unknown error');
    }
}
