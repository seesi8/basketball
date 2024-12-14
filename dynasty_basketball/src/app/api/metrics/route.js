import { cookies } from "next/headers";

async function getRosters(leagueID) {
    const response = await fetch(
        `https://api.sleeper.app/v1/league/${leagueID}/rosters`
    );
    if (!response.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    const data = await response.json();

    return data;
}

function getStandardDeviation(array) {
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(
        array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
    );
}

function calculateVariance(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
      throw new Error("Input must be a non-empty array of numbers.");
  }

  const n = numbers.length;

  // Calculate the mean (average)
  const mean = numbers.reduce((sum, num) => sum + num, 0) / n;

  // Calculate the variance
  const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / n;

  return variance;
}

// Helper function to calculate the mean

function calculateMean(data) {
    return data.reduce((sum, num) => sum + num, 0) / data.length;
}

function range(start, end) {
    if (start === end) return [start];
    return [start, ...range(start + 1, end)];
}

async function getMatchup(leagueID, week) {
    const response = await fetch(
        `https://api.sleeper.app/v1/league/${leagueID}/matchups/${week}`
    );
    if (!response.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    const data = await response.json();

    return data;
}

async function getWeek() {
    const response = await fetch(`https://api.sleeper.app/v1/state/nba`);
    if (!response.ok) {
        return new Response(JSON.stringify({ error: "Failed to fetch data" }), {
            status: response.status,
            headers: { "Content-Type": "application/json" },
        });
    }

    const data = await response.json();

    return data["week"];
}

export async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const leagueID = searchParams.get("leaugeID");
        const userID = searchParams.get("userID");

        if (!leagueID || !userID) {
            return new Response(
                JSON.stringify({ error: "leagueID and userID is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const rosters = await getRosters(leagueID);

        const week = await getWeek();

        const roster = rosters.find((value) => value["owner_id"] === userID);

        let metrics = {
            totalPoints: 0,
            high: 0,
            low: Number.MAX_VALUE,
            pointsWeeks: [],
            totalPointsAgainst: 0
        };

        for (let weekID in range(1, week)) {
            const currentWeek = parseInt(weekID) + 1;
            const week_matchups = await getMatchup(leagueID, currentWeek);

            const matchup = week_matchups.find(
                (value) => value["roster_id"] == roster["roster_id"]
            );
            const aMatchup = week_matchups.find(
                (value) =>
                    value["matchup_id"] == matchup["matchup_id"] &&
                    value["roster_id"] != roster["roster_id"]
            );

            if (matchup["points"] > metrics["high"]) {
                metrics["high"] = matchup["points"];
            }

            if (matchup["points"] < metrics["low"]) {
                metrics["low"] = matchup["points"];
            }

            metrics["totalPoints"] += matchup["points"];

            metrics["totalPointsAgainst"] += aMatchup["points"];

            metrics["pointsWeeks"].push(matchup["points"]);
        }

        metrics["week"] = week;

        metrics["avg"] = metrics["totalPoints"] / week;

        metrics["var"] = calculateVariance(metrics["pointsWeeks"]);
        metrics["std"] = getStandardDeviation(metrics["pointsWeeks"]);

        return new Response(JSON.stringify(metrics), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log(error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
