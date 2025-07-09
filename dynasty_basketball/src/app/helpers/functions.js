export async function getRecord(leaugeID, userID) {
    const baseUrl = "dynasty-basketball.com"
        ? "https://" + "dynasty-basketball.com"
        : "http://localhost:3000";
    console.log(process.env);
    return fetch(
        `${baseUrl}/api/record?` +
            new URLSearchParams({
                leaugeID: leaugeID,
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value[userID];
        });
}

export async function getRecords(leaugeID) {
    const baseUrl = "dynasty-basketball.com"
        ? "https://" + "dynasty-basketball.com"
        : "http://localhost:3000";
    console.log(process.env);
    return fetch(
        `${baseUrl}/api/record?` +
            new URLSearchParams({
                leaugeID: leaugeID,
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value;
        });
}

export async function get_value(playerID) {
    const baseUrl = "dynasty-basketball.com"
        ? "https://" + "dynasty-basketball.com"
        : "http://localhost:3000";
    console.log(process.env);
    return fetch(
        `${baseUrl}/api/value?` +
            new URLSearchParams({
                player: playerID,
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value["Value"];
        });
}

export async function get_age(playerID) {
    const baseUrl = "dynasty-basketball.com"
        ? "https://" + "dynasty-basketball.com"
        : "http://localhost:3000";
    console.log(process.env);
    return fetch(
        `${baseUrl}/api/value?` +
            new URLSearchParams({
                player: playerID,
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value["Age"];
        });
}

function averageNonZeroValues(arr) {
    const nonZeroValues = arr.filter((value) => value !== 0); // Filter out zero values
    const sum = nonZeroValues.reduce((sum, value) => sum + value, 0); // Sum the non-zero values
    return nonZeroValues.length > 0 ? sum / nonZeroValues.length : 0; // Calculate average
}

function filterByPosition(list, position) {
    return list
        .filter((item) => {
            if (item["Positions"]) {
                return (
                    item["Positions"].substring(0, position.length) == position
                );
            } else {
                return false;
            }
        })
        .sort((a, b) => b["Value"] - a["Value"]); // Sort by item["Value"]
}

function addRankings(data) {
    // Categories for which rankings need to be calculated
    const categories = [
        "total_value",
        "pg_value",
        "sg_value",
        "sf_value",
        "pf_value",
        "c_value",
        "picks_value",
        "starter_value",
    ];

    categories.forEach((category) => {
        // Sort data by category in descending order
        const sorted = [...data].sort(
            (a, b) => (b[category] || 0) - (a[category] || 0)
        );

        // Assign ranks
        sorted.forEach((item, index) => {
            item[`${category}_rank`] = index + 1;
        });
    });

    return data;
}

export async function get_player(playerID) {
    const baseUrl = "dynasty-basketball.com"
        ? "https://" + "dynasty-basketball.com"
        : "http://localhost:3000";
    console.log(process.env);
    return fetch(
        `${baseUrl}/api/value?` +
            new URLSearchParams({
                player: playerID,
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value;
        });
}

export async function get_picks(leaugeID) {
    const baseUrl = "dynasty-basketball.com"
        ? "https://" + "dynasty-basketball.com"
        : "http://localhost:3000";
    console.log(process.env);
    return fetch(
        `${baseUrl}/api/picks?` +
            new URLSearchParams({
                leaugeID: leaugeID,
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value;
        });
}

export async function get_name(userID) {
    const baseUrl = "dynasty-basketball.com"
        ? "https://" + "dynasty-basketball.com"
        : "http://localhost:3000";
    console.log(process.env);
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

async function getPicksValuesAndDetails(picks, item) {
    let picks_values = [];
    let picks_details = [];
    for (let ownerKey in picks) {
        let owner = picks[ownerKey];
        if (owner["owner_id"] === item["owner_id"]) {
            picks_details = await Promise.all(
                owner["picks"].map(async (pick) => {
                    return await get_player(pick);
                })
            );

            picks_values = await Promise.all(
                owner["picks"].map(async (pick) => {
                    return parseInt(await get_value(pick));
                })
            );
            break; // Exit the loop once the correct owner is found
        }
    }

    return [picks_details, picks_values];
}

async function addInformationToOwner(item, pLeaugeID, picks, records) {
    const owner_name = await get_name(item["owner_id"]);

    // Resolve all promises in the player_values map
    item["player_details"] = await Promise.all(
        item["players"].map(async (player) => {
            return await get_player(player);
        })
    );

    item["player_values"] = [];
    item["player_ages"] = [];

    item["player_details"].forEach(async (player, index) => {
        item["player_values"].push(parseInt(player["Value"]));
        item["player_ages"].push(parseInt(player["Age"]));
    });

    item["player_ages"] = item["player_ages"].map((value) =>
        isNaN(value) ? 0 : value
    );
    item["avg_age"] =
        item["player_ages"].reduce((a, b) => a + b, 0) /
        item["player_ages"].length;

    //Positions
    item["pgs"] = filterByPosition(item["player_details"], "PG");
    item["sgs"] = filterByPosition(item["player_details"], "SG");
    item["sfs"] = filterByPosition(item["player_details"], "SF");
    item["pfs"] = filterByPosition(item["player_details"], "PF");
    item["cs"] = filterByPosition(item["player_details"], "C");

    //Starters
    item["starter_values"] = await Promise.all(
        item["starters"].map(async (player) => {
            const player_value = item["player_details"].find((object) => {
                object["original_key"] == player;
            });
            if (player_value != undefined) {
                return parseInt(player_value["Value"]);
            } else {
                return 0;
            }
        })
    );
    item["starter_value"] = item["starter_values"].reduce((a, b) => a + b, 0);

    //Ages & Values
    item["pg_ages"] = [];
    item["pg_values"] = [];

    item["sg_ages"] = [];
    item["sg_values"] = [];

    item["sf_ages"] = [];
    item["sf_values"] = [];

    item["pf_ages"] = [];
    item["pf_values"] = [];

    item["c_ages"] = [];
    item["c_values"] = [];

    Object.keys(
        item["player_details"].filter(
            (player_value) => player_value["Positions"] != undefined
        )
    ).forEach((key, index) => {
        let player_value = item["player_details"][key];

        const position = player_value["Positions"].split(",")[0].toLowerCase();

        item[`${position}_ages`].push(parseInt(player_value["Age"]));
        item[`${position}_values`].push(parseInt(player_value["Value"]));
    });

    item["pg_value"] = item["pg_values"].reduce((a, b) => a + b, 0);

    item["pg_age"] = averageNonZeroValues(item["pg_ages"]);

    //Shooting Guards
    item["sg_value"] = item["sg_values"].reduce((a, b) => a + b, 0);
    item["sg_age"] = averageNonZeroValues(item["sg_ages"]);

    //Small Forwards
    item["sf_value"] = item["sf_values"].reduce((a, b) => a + b, 0);
    item["sf_age"] = averageNonZeroValues(item["sf_ages"]);

    //Power Forwards
    item["pf_value"] = item["pf_values"].reduce((a, b) => a + b, 0);
    item["pf_age"] = averageNonZeroValues(item["pf_ages"]);

    //Centers
    item["c_value"] = item["c_values"].reduce((a, b) => a + b, 0);
    item["c_age"] = averageNonZeroValues(item["c_ages"]);

    let [picks_details, picks_values] = await getPicksValuesAndDetails(
        picks,
        item
    );
    item["picks_details"] = picks_details;
    item["picks_values"] = picks_values;

    item["picks_value"] = item["picks_values"].reduce((a, b) => a + b, 0);

    item["player_values"] = item["player_values"].map((value) =>
        isNaN(value) ? 0 : value
    );

    item["total_value"] =
        item["player_values"].reduce((a, b) => a + b, 0) + item["picks_value"];

    item["record"] = records[item["owner_id"]];

    return { ...item, name: owner_name };
}

export async function getFormatedRosters(value, player, pLeaugeID) {
    const picks = await get_picks(pLeaugeID);
    const records = await await getRecords(pLeaugeID);

    let named_rosters = await Promise.all(
        value.map(async (item) => {
            return addInformationToOwner(item, pLeaugeID, picks, records);
        })
    );

    named_rosters.sort((a, b) => b["total_value"] - a["total_value"]);

    named_rosters = addRankings(named_rosters);

    //setRosters
    return named_rosters.find(({ owner_id }) => owner_id == player);
}

export async function getAllFormatedRosters(value, pLeaugeID) {
    const picks = await get_picks(pLeaugeID);
    const records = await await getRecords(pLeaugeID);

    let named_rosters = await Promise.all(
        value.map(async (item) => {
            return addInformationToOwner(item, pLeaugeID, picks, records);
        })
    );

    named_rosters.sort((a, b) => b["total_value"] - a["total_value"]);

    named_rosters = addRankings(named_rosters);

    //setRosters
    return named_rosters;
}
