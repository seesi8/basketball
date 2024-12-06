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

function range(start, end) {
  if(start === end) return [start];
  return [start, ...range(start + 1, end)];
}


async function getMatchup(leagueID, week){
  const response = await fetch(`https://api.sleeper.app/v1/league/${leagueID}/matchups/${week}`);
  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await response.json();

  return data
}

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
    const searchParams = request.nextUrl.searchParams;
    const leagueID = searchParams.get('leaugeID');
    const userID = searchParams.get('userID');

    if ((!leagueID) || (!userID)) {
      return new Response(JSON.stringify({ error: 'leagueID and userID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }


    const rosters = await getRosters(leagueID)

    const week = await getWeek()

    const roster = rosters.find((value) => value["owner_id"] === userID)
    
    let total_points = 0

    for(let weekID in range(1,week)){
      const currentWeek = parseInt(weekID) + 1;
      const week_matchups = await getMatchup(leagueID, currentWeek+1)

      const matchup = week_matchups.find((value) => value["roster_id"] == roster["roster_id"])

      console.log(currentWeek, week_matchups)

      total_points += matchup["points"]
    }


    return new Response(JSON.stringify(total_points), {
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
