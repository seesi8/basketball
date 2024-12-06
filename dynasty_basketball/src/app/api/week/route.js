import { cookies } from 'next/headers';

async function getWeek(){
  const response = await fetch(`https://api.sleeper.app/v1/state/nba`);
  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await response.json();

  return data["week"]
}


export async function GET(request) {
  try {
    const data = await getWeek();
    return new Response(data, {
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
