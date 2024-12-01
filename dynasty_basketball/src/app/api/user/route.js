import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userID = searchParams.get('userID');

    if (!userID) {
      return new Response(JSON.stringify({ error: 'userID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`https://api.sleeper.app/v1/user/${userID}`);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
