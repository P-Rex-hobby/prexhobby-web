import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    
    const response = await axios.get('https://app.prexhobby.com/subscribe/summary-list', {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching subscribes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribes' },
      { status: 500 }
    );
  }
} 