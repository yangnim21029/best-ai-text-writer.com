import { NextRequest } from 'next/server';
import { AIProxyService } from '@/services/engine/aiProxyService';

export async function POST(
  request: NextRequest, 
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return AIProxyService.handlePost(request, path);
}

export async function GET(
  request: NextRequest, 
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return AIProxyService.handleGet(request, path);
}