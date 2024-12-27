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

const calculatePoints = (data) => {
  const result = {};

  // Create a map to calculate total points against each roster
  const matchupPoints = data.reduce((acc, item) => {
      if (!acc[item.matchup_id]) acc[item.matchup_id] = [];
      acc[item.matchup_id].push(item);
      return acc;
  }, {});

  data.forEach(item => {
      const { roster_id, points, matchup_id } = item;
      
      // Calculate pointsFor
      if (!result[roster_id]) {
          result[roster_id] = { pointsFor: 0, pointsAgainst: 0 };
      }
      result[roster_id].pointsFor += points;

      // Calculate pointsAgainst
      const opponents = matchupPoints[matchup_id].filter(opponent => opponent.roster_id !== roster_id);
      const pointsAgainst = opponents.reduce((sum, opponent) => sum + opponent.points, 0);
      result[roster_id].pointsAgainst += pointsAgainst;
  });

  return result;
};

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
    
    let points = {}

    for(let weekID in range(1,week)){
      const currentWeek = parseInt(weekID) + 1;
      const week_matchups = calculatePoints(await getMatchup(leagueID, currentWeek))

      const matchup = week_matchups[roster["roster_id"]]

      points[currentWeek] = matchup;
    }


    return new Response(JSON.stringify(points), {
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
