import { cookies } from "next/headers";

function userInTranscation(userID, roster_id, transaction) {
    if (transaction["roster_ids"]) {
        return transaction["roster_ids"].includes(roster_id);
    } else {
        return transaction["creator"] == userID;
    }
}

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

async function get_name(userID) {
    const baseUrl = process.env.VERCEL_URL
        ? "https://" + process.env.VERCEL_URL
        : "http://localhost:3000";

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

async function get_value(player) {
    const baseUrl = process.env.VERCEL_URL
        ? "https://" + process.env.VERCEL_URL
        : "http://localhost:3000";

    return fetch(
        `${baseUrl}/api/value?` +
            new URLSearchParams({
                player: player,
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value;
        });
}

async function getTeamName(leagueID, owner_id) {
    const baseUrl = process.env.VERCEL_URL
        ? "https://" + process.env.VERCEL_URL
        : "http://localhost:3000";

    return fetch(
        `${baseUrl}/api/team?` +
            new URLSearchParams({
                userID: owner_id,
                leaugeID: leagueID,
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            if (value["metadata"]["team_name"]) {
                return value["metadata"]["team_name"];
            } else {
                return `Team ${value["display_name"]}`;
            }
        });
}

async function getReleventInformation(transaction, leagueID, userID, rosters) {
    // console.log(transaction)
    if (transaction.status != "complete") {
        return;
    }
    if (transaction.type == "trade") {
        const info = {
            type: "trade",
            sentTrade: userID === transaction.creator,
            transaction_id: transaction.transaction_id,
            toID: "",
            toTeamName: "",
            receivingIDs: [],
            sendingIDs: [],
            receivingPicks: [],
            sendingPicks: [],
        };
        let toRoster;
        const ownRoster = rosters.find((value) => value.owner_id == userID);

        if (!info.sentTrade) {
            info["toID"] = transaction.creator;
            toRoster = rosters.find(
                (value) => value.owner_id == transaction.creator
            );
        } else {
            const to_roster_id = transaction.roster_ids.find(
                (value) => value != ownRoster.roster_id
            );
            toRoster = rosters.find((value) => value.roster_id == to_roster_id);
            info["toID"] = toRoster.owner_id;
        }

        info["toTeamName"] = await getTeamName(leagueID, info["toID"]);

        if (transaction.adds != undefined) {
            info["receivingIDs"] = await Promise.all(
                Object.keys(transaction.adds)
                    .filter(
                        (key) => transaction.adds[key] === ownRoster.roster_id
                    )
                    .map(async (player) => {
                        const value = await get_value(player);
                        return value;
                    })
            );
            info["sendingIDs"] = await Promise.all(
                Object.keys(transaction.adds)
                    .filter(
                        (key) => transaction.adds[key] === toRoster.roster_id
                    )
                    .map(async (player) => {
                        const value = await get_value(player);
                        return value;
                    })
            );
        }

        if (transaction.draft_picks) {
            info["receivingPicks"] = await Promise.all(
                transaction.draft_picks
                    .filter((value) => value.owner_id === ownRoster.roster_id)
                    .map(async (pick) => {
                        const id = rosters.find(
                            (value) => value.roster_id === pick.roster_id
                        ).owner_id;
                        const team_name = await get_name(id);
                        const value = await get_value(
                            `${pick.season}rd${pick.round}|via|${team_name}`
                        );
                        return value;
                    })
            );
            info["sendingPicks"] = await Promise.all(
                transaction.draft_picks
                    .filter((value) => value.owner_id === toRoster.roster_id)
                    .map(async (pick) => {
                        const id = rosters.find(
                            (value) => value.roster_id === pick.roster_id
                        ).owner_id;
                        const team_name = await get_name(id);
                        const value = await get_value(
                            `${pick.season}rd${pick.round}|via|${team_name}`
                        );
                        return value;
                    })
            );
        }

        return info;
    } else {
        const info = {
            type: "free_agency",
            sentTrade: userID === transaction.creator,
            transaction_id: transaction.transaction_id,
            toID: "free_agency",
            toTeamName: "free_agency",
            receivingIDs: [],
            sendingIDs: [],
            receivingPicks: [],
            sendingPicks: [],
        };
        if (transaction.adds) {
            info["receivingIDs"] = await Promise.all(
                Object.keys(transaction.adds).map(async (player) => {
                    const value = await get_value(player);
                    return value;
                })
            );
        }
        if (transaction.drops) {
            info["sendingIDs"] = await Promise.all(
                Object.keys(transaction.drops).map(async (player) => {
                    const value = await get_value(player);
                    return value;
                })
            );
        }
        return info;
    }
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
        const userID = searchParams.get("userID");
        const leaugeID = searchParams.get("leaugeID");
        const week = await getWeek();

        if (!(userID && leaugeID)) {
            return new Response(
                JSON.stringify({ error: "userID is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const rosters = await getRosters(leaugeID);

        const all_transactions = (
            await Promise.all(
                [...Array(week).keys()].map(async (i) => {
                    const currentWeek = i + 1;

                    const response = await fetch(
                        `https://api.sleeper.app/v1/league/${leaugeID}/transactions/${currentWeek}`
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

                    return data.filter(
                        (transaction) => transaction["type"] == "trade"
                    );
                })
            )
        )
            .reduce((acc, curr) => acc.concat(curr), [])
            .sort((a, b) => b.created - a.created);

        const roster_id = rosters.find(
            (value) => value.owner_id === userID
        ).roster_id;

        const links = all_transactions
            .map((value) => {
                if (value["adds"] == null) {
                    return;
                }
                return Object.keys(value["adds"]).map((key) => {
                    {
                        const y_roster_id = value["adds"][key];
                        if (roster_id != y_roster_id) {
                            return;
                        }
                        return Object.keys(value["adds"])
                            .map((x_key) => {
                                const x_roster_id = value["adds"][x_key];
                                if (x_roster_id != roster_id) {
                                    return {
                                        source: key,
                                        target: x_key,
                                        color: "white",
                                    };
                                }
                            })
                            .filter((value) => value != null);
                    }
                });
            })
            .reduce((acc, curr) => acc.concat(curr), [])
            .filter((value) => value != null)
            .reduce((acc, curr) => acc.concat(curr), []);

        const links_picks = all_transactions
            .map((value) => {
                console.log(value)
                if (value["draft_picks"] == null) {
                    return "hi";
                }
                return value["draft_picks"].map((key) => {
                    {
                        const y_roster_id = key["owner_id"];
                        if (roster_id != y_roster_id) {
                            console.log(roster_id, y_roster_id)
                            return;
                        }
                        return value["draft_picks"]
                            .map((x_key) => {
                                const x_roster_id = x_key["owner_id"];
                                if (x_roster_id != roster_id) {
                                    return {
                                        source: y_roster_id,
                                        target: x_roster_id,
                                        color: "white",
                                    };
                                }
                            })
                            .filter((value) => value != null);
                    }
                });
            })
            // .reduce((acc, curr) => acc.concat(curr), [])
            // .filter((value) => value != null)
            // .reduce((acc, curr) => acc.concat(curr), []);

        return new Response(JSON.stringify(links_picks), {
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
