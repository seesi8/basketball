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
    const baseUrl = !process.env.DEV ? "https://" + process.env.VERCEL_URL
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
    const baseUrl = !process.env.DEV ? "https://" + process.env.VERCEL_URL
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
    const baseUrl = !process.env.DEV ? "https://" + process.env.VERCEL_URL
        : "http://localhost:3000";

    return fetch(
        `${baseUrl}/api/team?` +
        new URLSearchParams({
            userID: owner_id,
            leagueID: leagueID,
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

async function getTeamAvatar(leagueID, owner_id) {
    const baseUrl = !process.env.DEV ? "https://" + process.env.VERCEL_URL
        : "http://localhost:3000";

    return fetch(
        `${baseUrl}/api/team?` +
        new URLSearchParams({
            userID: owner_id,
            leagueID: leagueID,
        }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value["avatar"];
        });
}

const mergeByTransactionId = (data) => {
    return Object.values(
        data.reduce((acc, item) => {
            const { transaction_id, ...rest } = item;
            if (!acc[transaction_id]) {
                acc[transaction_id] = { transaction_id, ...rest };
            } else {
                Object.assign(acc[transaction_id], rest);
            }
            return acc;
        }, {})
    );
};

function mergeTransactions(transactions) {
    // Create a map to store merged transactions by transaction_id
    const transactionMap = new Map();

    transactions.forEach((transaction) => {
        const { transaction_id, adds } = transaction;

        if (!transactionMap.has(transaction_id)) {
            // If transaction_id is not in the map, add it
            transactionMap.set(transaction_id, {
                transaction_id,
                adds: { ...adds },
            });
        } else {
            // If transaction_id is already in the map, merge the adds
            const existingTransaction = transactionMap.get(transaction_id);

            // Merge adds by adding new keys directly
            Object.assign(existingTransaction.adds, adds);
        }
    });

    // Convert the map back into an array
    return Array.from(transactionMap.values());
}

async function getReleventInformation(transaction, leagueID, userID, rosters) {
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

const filterEntries = (entries, roster_id) => {
    return entries.filter((entry) => {
        // Check if any value in the "adds" object equals 2
        let allowed = false;
        if (entry.adds) {
            if (
                Object.values(entry.adds).some((value) => value === roster_id)
            ) {
                allowed = true;
            }
        }
        if (entry.draft_picks) {
            if (
                Object.values(entry.draft_picks).some((value) => {
                    return value.owner_id === roster_id;
                })
            ) {
                allowed = true;
            }
        }
        return allowed;
    });
};

function removeDuplicatesFromObjects(arr) {
    const seen = new Set();
    return arr.filter((item) => {
        const key = JSON.stringify(item);
        if (seen.has(key)) {
            return false;
        } else {
            seen.add(key);
            return true;
        }
    });
}

async function get_pre_nodes_from_merged(merged, leagueID) {
    return await Promise.all(
        merged.map(async (value) => {
            return await Promise.all(
                Object.keys(value["adds"]).map(async (key) => {
                    const roster_id = value["adds"][key];

                    const player_value = await get_value(key);
                    let name = player_value["Name"];
                    let id = player_value["id"];
                    let url = `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${id}.png&w=350&h=254`;

                    if (key.includes("|")) {
                        const theName = await get_name(
                            name.split("|")[2]
                        );
                        name = `${key.split("|")[0]}|${key.split("|")[1]
                            }|${theName}`;
                        id = await getTeamAvatar(
                            leagueID,
                            key.split("|")[2]
                        );
                        url = `https://sleepercdn.com/avatars/thumbs/${id}`;
                    }

                    let data = {
                        id: key,
                        name: name,
                        color: "#282837",
                        image_id: url,
                    };

                    return data;
                })
            );
        })
    )
}

function get_links_from_merged(merged, roster_id) {
    return merged
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
                                    source: x_key,
                                    target: key,
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
}

async function get_links_picks_from_all_transactions(all_transactions, rosters) {
    return mergeByTransactionId(
        (
            await Promise.all(
                all_transactions.map(async (y_value) => {
                    if (y_value["draft_picks"] == null) {
                        return "hi";
                    }
                    return await Promise.all(
                        y_value["draft_picks"].map(async (value) => {
                            const theRosterID = rosters.find(
                                (x_value) =>
                                    x_value["roster_id"] ==
                                    value["roster_id"]
                            )["owner_id"];
                            const theName = await get_name(theRosterID);
                            return {
                                [`${value["season"]}rd${value["round"]}|via|${theRosterID}`]:
                                    value["owner_id"],
                                transaction_id: y_value["transaction_id"],
                            };
                        })
                    );
                })
            )
        )
            .reduce((acc, curr) => acc.concat(curr), [])
            .filter((value) => value != null)
            .reduce((acc, curr) => acc.concat(curr), [])
    ).map((value) => {

        return {
            transaction_id: value["transaction_id"],
            adds: Object.fromEntries(
                Object.entries(value).filter(
                    ([key]) => key !== "transaction_id"
                )
            ),
        };
    });
}

async function get_all_transactions(roster_id, week, leagueID) {
    return filterEntries(
        (
            await Promise.all(
                [...Array(week).keys()].map(async (i) => {
                    const currentWeek = i + 1;

                    const response = await fetch(
                        `https://api.sleeper.app/v1/league/${leagueID}/transactions/${currentWeek}`
                    );
                    if (!response.ok) {
                        return new Response(
                            JSON.stringify({
                                error: "Failed to fetch data",
                            }),
                            {
                                status: response.status,
                                headers: {
                                    "Content-Type": "application/json",
                                },
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
            .sort((a, b) => b.created - a.created),
        roster_id
    );
}

async function get_nodes_links(userID, leagueID, week) {
    const rosters = await getRosters(leagueID);
    const roster_id = rosters.find(
        (value) => value.owner_id === userID
    ).roster_id;

    const all_transactions = await get_all_transactions(roster_id, week, leagueID)

    const links_picks = await get_links_picks_from_all_transactions(all_transactions, rosters)

    const merged = mergeTransactions([...all_transactions, ...links_picks]);

    const links = get_links_from_merged(merged, roster_id)

    const pre_nodes = (
        await get_pre_nodes_from_merged(merged, leagueID)
    )
        .filter((value) => value != null)
        .reduce((acc, curr) => acc.concat(curr), [])

    const nodes = removeDuplicatesFromObjects(
        pre_nodes
    );

    return {nodes, links}
}


async function get_previous_league_ID(leagueID) {
    const baseUrl = !process.env.DEV ? "https://" + process.env.VERCEL_URL
        : "http://localhost:3000";

    return fetch(
        `${baseUrl}/api/sleeper?` +
        new URLSearchParams({
            leagueID: leagueID,
        }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value["previous_league_id"];
        });
}

async function get_max_week(leagueID) {
    const baseUrl = !process.env.DEV ? "https://" + process.env.VERCEL_URL
        : "http://localhost:3000";

    return fetch(
        `${baseUrl}/api/sleeper?` +
        new URLSearchParams({
            leagueID: leagueID,
        }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            console.log(value)
            return value["settings"]["playoff_week_start"] - 1;
        });
}

async function get_all_previous_league_IDs(leagueID) {
    let previous_league_IDs = [leagueID];
    let current_league_ID = leagueID;

    while (true) {
        const previous_league_ID = await get_previous_league_ID(
            current_league_ID
        );
        if (
            previous_league_ID == "0"
        ) {
            break;
        } else {
            previous_league_IDs.push(previous_league_ID);
            current_league_ID = previous_league_ID;
        }
    }

    return previous_league_IDs;
}

export async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userID = searchParams.get("userID");
        const leagueID = searchParams.get("leagueID");
        const week = (await getWeek()) + 1;
        const all_previous_league_IDs = await get_all_previous_league_IDs(leagueID)

        if (!(userID && leagueID)) {
            return new Response(
                JSON.stringify({ error: "userID is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        let nodes = []
        let links = []

        for(let previous_league_ID of all_previous_league_IDs){
            console.log("previous_league_ID " + previous_league_ID + " Leauge ID " + leagueID)
            if(previous_league_ID == leagueID){
                const {nodes: _nodes, links: _links} = await get_nodes_links(userID, leagueID, week)
                nodes = [...nodes, ..._nodes]
                links = [...links, ..._links]
            }
            else{
                //previous
                const max_week = await get_max_week(previous_league_ID)
                const {nodes: _nodes,links:  _links} = await get_nodes_links(userID, previous_league_ID, max_week)
                nodes = [...nodes, ..._nodes]
                links = [...links, ..._links]
            }
        }


        const data = {
            nodes: nodes,
            links: links,
        };

        return new Response(JSON.stringify(data), {
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
