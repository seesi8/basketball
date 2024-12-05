import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userID = searchParams.get('userID');
    const leaugeID = searchParams.get('leaugeID');

    if ((!userID) || (!leaugeID)) {
      return new Response(JSON.stringify({ error: 'userID & leaugeID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`https://api.sleeper.app/v1/league/${leaugeID}/users`);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const player = data.find(user => user.user_id == userID)

    return new Response(JSON.stringify(player), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.log(error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
