import { NextRequest, NextResponse } from 'next/server';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const { path } = await context.params;
    const joinedPath = path.join('/');
    const body = await request.json();

    const aiBaseUrl = process.env.AI_BASE_URL || 'http://localhost:3000';
    const aiToken = process.env.AI_TOKEN;

    const targetUrl = `${aiBaseUrl.replace(/\/$/, '')}/${joinedPath}`;

    console.log(`[AI Proxy] Proxying to ${targetUrl}`);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (aiToken) {
        headers['Authorization'] = `Bearer ${aiToken}`;
    }

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return NextResponse.json(data, { status: response.status });
        } else {
            const text = await response.text();
            console.warn(`[AI Proxy] Received non-JSON response from ${targetUrl}:`, text.substring(0, 200));
            return new NextResponse(text, {
                status: response.status,
                headers: { 'Content-Type': contentType || 'text/plain' }
            });
        }
    } catch (error: any) {
        console.error(`[AI Proxy] Error proxying to ${targetUrl}:`, error);
        return NextResponse.json(
            { error: 'Failed to proxy request to AI service', details: error.message },
            { status: 500 }
        );
    }
}

// Support other methods if needed
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ path: string[] }> }
) {
    const { path } = await context.params;
    const joinedPath = path.join('/');
    const aiBaseUrl = process.env.AI_BASE_URL || 'http://localhost:3000';

    const targetUrl = `${aiBaseUrl.replace(/\/$/, '')}/${joinedPath}`;

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to proxy request to AI service', details: error.message },
            { status: 500 }
        );
    }
}
