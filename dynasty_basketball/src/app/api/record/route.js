import { cookies } from 'next/headers';


async function getRosters(leagueID){
  const response = await fetch(`https://api.sleeper.app/v1/league/${leagueID}/rosters`);
  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await response.json();

  return data
}

function calculateOwnerRecords(rosters) {
  const records = {};
  rosters.forEach(roster => {
      const { owner_id, settings } = roster;
      const { wins, losses, ties } = settings;

      // Initialize the record for the owner_id
      if (!records[owner_id]) {
          records[owner_id] = { wins: 0, losses: 0, ties: 0 };
      }

      // Update the record
      records[owner_id].wins += wins;
      records[owner_id].losses += losses;
      records[owner_id].ties += ties;
  });

  return records;
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leagueID = searchParams.get('leagueID');

    if (!leagueID) {
      return new Response(JSON.stringify({ error: 'leagueID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(leagueID)
    const data = await getRosters(leagueID)

    const records =  calculateOwnerRecords(data)

    return new Response(JSON.stringify(records), {
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
