import { cookies } from "next/headers";

// Function to adjust picks based on transactions and sort them alphabetically
async function adjustPicksAndSort(rosters, transactions) {
    for (const transaction of transactions) {
        const round = transaction.round;
        const season = transaction.season;
        const fromRosterId = transaction.previous_owner_id;
        const toRosterId = transaction.owner_id;

        // Find fromRoster and toRoster
        const fromRoster = rosters.find(
            (roster) => roster.roster_id === fromRosterId
        );
        const toRoster = rosters.find(
            (roster) => roster.roster_id === toRosterId
        );

        if (fromRoster && toRoster) {
            const fromRosterName = fromRoster.owner_name;

            // Construct the pick string
            const pick = `${season}rd${round}|via|${fromRosterName}`;

            // Transfer the pick
            const pickIndex = fromRoster.picks.indexOf(pick);
            if (pickIndex > -1) {
                fromRoster.picks.splice(pickIndex, 1);
                toRoster.picks.push(pick);
            }
        }
    }

    // Sort all picks alphabetically for each roster
    rosters.forEach((roster) => {
        roster.picks.sort();
    });

    return rosters;
}

async function get_name(userID) {
    const baseUrl = !process.env.DEV ?  "https://" + "www.dynasty-basketball.com"
        : "http://localhost:3000";
    
    console.log("baseUrl in get_name:", baseUrl);
    console.log(
        `${baseUrl}/api/user?` +
            new URLSearchParams({
                userID: userID,
            }).toString()
    );
    return fetch(
        `${baseUrl}/api/user?` +
            new URLSearchParams({
                userID: userID,
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value["display_name"];
        });
}

export async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const leagueID = searchParams.get("leagueID");

        if (!leagueID) {
            return new Response(
                JSON.stringify({ error: "leagueID is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const response = await fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/rosters`
        );
        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: "Failed to fetch data" }),
                {
                    status: response.status,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const data = await response.json();
        const rosters = await Promise.all(
            data.map(async (roster, index) => {
                const name = await get_name(roster["owner_id"]);
                console.log(
                    [...Array(3)
                        .keys()]
                        .map((key) => `${2026 + key}rd1|via|${name}`)
                );
                return {
                    roster_id: roster["roster_id"],
                    owner_id: roster["owner_id"],
                    owner_name: name,
                    picks: [
                        ...[...Array(3)
                            .keys()]
                            .map((key) => `${2026 + key}rd1|via|${name}`),
                        ...[...Array(3)
                            .keys()]
                            .map((key) => `${2026 + key}rd2|via|${name}`),
                    ],
                };
            })
        );

        const res = await fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/traded_picks`
        );
        if (!res.ok) {
            return new Response(
                JSON.stringify({ error: "Failed to fetch data" }),
                {
                    status: response.status,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const transactions = await res.json();

        //adjust the picks
        const updatedRosters = await adjustPicksAndSort(rosters, transactions);
        adjustPicksAndSort;
        return new Response(JSON.stringify(updatedRosters), {
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
