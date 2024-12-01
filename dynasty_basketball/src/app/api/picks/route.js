import { cookies } from 'next/headers';

// Function to adjust picks based on transactions and sort them alphabetically
function adjustPicksAndSort(rosters, transactions) {
  transactions.forEach(transaction => {
      const round = transaction.round;
      const season = transaction.season;
      const fromRosterId = transaction.previous_owner_id;
      const toRosterId = transaction.owner_id;

      // Construct the pick string
      const pick = `${season}rd${round}`;

      // Find fromRoster and toRoster
      const fromRoster = rosters.find(roster => roster.roster_id === fromRosterId);
      const toRoster = rosters.find(roster => roster.roster_id === toRosterId);

      // Transfer the pick
      if (fromRoster && toRoster) {
          const pickIndex = fromRoster.picks.indexOf(pick);
          if (pickIndex > -1) {
              fromRoster.picks.splice(pickIndex, 1);
              toRoster.picks.push(pick);
          }
      }
  });

  // Sort all picks alphabetically for each roster
  rosters.forEach(roster => {
      roster.picks.sort();
  });

  return rosters;
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leagueID = searchParams.get('leaugeID');

    if (!leagueID) {
      return new Response(JSON.stringify({ error: 'leagueID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueID}/rosters`);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    const rosters = data.map((roster, index) => {
      return {
        "roster_id": roster["roster_id"],
        "owner_id": roster["owner_id"],
        "picks": [...Array(3).keys().map((key) => `${2025+key}rd1`), ...Array(3).keys().map((key) => `${2025+key}rd2`)]
      }
    })

    const res = await fetch(`https://api.sleeper.app/v1/league/${leagueID}/traded_picks`);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const transactions = await res.json()


    //adjust the picks
    const updatedRosters = adjustPicksAndSort(rosters, transactions);

    return new Response(JSON.stringify(updatedRosters), {
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
