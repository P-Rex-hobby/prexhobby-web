import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const apiBaseUrl = process.env.PREXHOBBY_API_BASE_URL || 'http://localhost:9999';
    const response = await axios.get(`${apiBaseUrl}/api/subscribes`, {
      params,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Keep response shape compatible with existing UI code (expects { data: Pagination })
    return NextResponse.json({ data: response.data });
  } catch (error) {
    console.error('Error fetching subscribes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscribes' },
      { status: 500 }
    );
  }
} 
