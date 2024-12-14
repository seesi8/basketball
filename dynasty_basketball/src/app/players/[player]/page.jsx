"use client";

import Image from "next/image";
import styles from "../../styles/player.module.css";
import { useEffect, useState } from "react";
import { use } from "react";
import { getCookie, setCookie } from "cookies-next/client";
import { FaChartLine } from "react-icons/fa";
import { HiMiniUserGroup } from "react-icons/hi2";
import { BiReceipt } from "react-icons/bi";
import { PiGraphLight } from "react-icons/pi";
import Roster from "@/app/components/roster";
import Insights from "@/app/components/insights";
import Activity from "@/app/components/activity";
import Trade from "@/app/components/trade";

async function get_name(userID) {
    return fetch(
        "/api/user?" +
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

async function get_record(userID) {
    return fetch(
        "/api/record?" +
            new URLSearchParams({
                leaugeID: getCookie("leaugeID"),
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value[userID];
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

async function getRecord(leaugeID, userID) {
    return fetch(
        "/api/record?" +
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

async function get_value(playerID) {
    return fetch(
        "/api/value?" +
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

async function get_age(playerID) {
    return fetch(
        "/api/value?" +
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

async function get_player(playerID) {
    return fetch(
        "/api/value?" +
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

async function get_picks(leaugeID) {
    return fetch(
        "/api/picks?" +
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

async function get_team_name(userID) {
    return fetch(
        "/api/team?" +
            new URLSearchParams({
                userID: userID,
                leaugeID: getCookie("leaugeID"),
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

async function total_points(userID) {
    return fetch(
        "/api/points?" +
            new URLSearchParams({
                userID: userID,
                leaugeID: getCookie("leaugeID"),
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((res) => {
            return res;
        });
}

async function getWeek() {
    return fetch("/api/week")
        .then((res) => {
            return res.json();
        })
        .then((res) => {
            return res;
        });
}

export default function Home({ params }) {
    const [name, setName] = useState("");
    const [teamName, setTeamName] = useState("");
    const [record, setRecord] = useState("");
    const { player } = use(params);
    const [rosters, setRosters] = useState({});
    const [totalPoints, setTotalPoints] = useState(0);
    const [avgPoints, setAvgPoints] = useState(0);
    const [activeTab, setActiveTab] = useState("insights");

    useEffect(() => {
        get_name(player).then((value) => {
            setName(value);
        });

        get_team_name(player).then((value) => {
            setTeamName(value);
        });

        get_record(player).then((value) => {
            setRecord(
                `${value["wins"]}-${value["losses"]}${
                    value["ties"] > 0 ? `-${value["ties"]}` : ""
                }`
            );
        });

        total_points(player).then(async (value) => {
            setTotalPoints(value);
            setAvgPoints(value / (await getWeek()));
        });
    }, []);

    // Set Rosters
    useEffect(() => {
        fetch(
            "/api/rosters?" +
                new URLSearchParams({
                    leaugeID: getCookie("leaugeID"),
                }).toString()
        )
            .then((res) => res.json())
            .then(async (value) => {
                // Resolve all promises in the map for named_rosters
                let named_rosters = await Promise.all(
                    value.map(async (item) => {
                        const owner_name = await get_name(item["owner_id"]);

                        // Resolve all promises in the player_values map
                        item["player_details"] = await Promise.all(
                            item["players"].map(async (player) => {
                                return await get_player(player);
                            })
                        );

                        // Resolve all promises in the player_values map
                        item["player_values"] = await Promise.all(
                            item["player_details"].map(async (player) => {
                                return parseInt(player["Value"]);
                            })
                        );

                        // Resolve all promises in the player_values map
                        item["player_ages"] = await Promise.all(
                            item["player_details"].map(async (player) => {
                                return parseInt(player["Age"]);
                            })
                        );

                        item["player_ages"] = item["player_ages"].map((value) =>
                            isNaN(value) ? 0 : value
                        );
                        item["avg_age"] =
                            item["player_ages"].reduce((a, b) => a + b, 0) /
                            item["player_ages"].length;

                        //Positions
                        item["pgs"] = filterByPosition(
                            item["player_details"],
                            "PG"
                        );
                        item["sgs"] = filterByPosition(
                            item["player_details"],
                            "SG"
                        );
                        item["sfs"] = filterByPosition(
                            item["player_details"],
                            "SF"
                        );
                        item["pfs"] = filterByPosition(
                            item["player_details"],
                            "PF"
                        );
                        item["cs"] = filterByPosition(
                            item["player_details"],
                            "C"
                        );

                        //Starters
                        item["starter_values"] = await Promise.all(
                            item["starters"].map(async (player) => {
                                const player_value = await get_player(player);
                                return parseInt(player_value["Value"]);
                            })
                        );
                        item["starter_value"] = item["starter_values"].reduce(
                            (a, b) => a + b,
                            0
                        );

                        //Point Guards
                        item["pg_values"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 2) ==
                                    "PG"
                                ) {
                                    return parseInt(player_value["Value"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["pg_value"] = item["pg_values"].reduce(
                            (a, b) => a + b,
                            0
                        );

                        item["pg_ages"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 2) ==
                                    "PG"
                                ) {
                                    return parseInt(player_value["Age"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["pg_age"] = averageNonZeroValues(item["pg_ages"]);

                        //Shooting Guards
                        item["sg_values"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 2) ==
                                    "SG"
                                ) {
                                    return parseInt(player_value["Value"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["sg_value"] = item["sg_values"].reduce(
                            (a, b) => a + b,
                            0
                        );

                        item["sg_ages"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 2) ==
                                    "SG"
                                ) {
                                    return parseInt(player_value["Age"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["sg_age"] = averageNonZeroValues(item["sg_ages"]);

                        //Small Forwards
                        item["sf_values"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 2) ==
                                    "SF"
                                ) {
                                    return parseInt(player_value["Value"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["sf_value"] = item["sf_values"].reduce(
                            (a, b) => a + b,
                            0
                        );

                        item["sf_ages"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 2) ==
                                    "SF"
                                ) {
                                    return parseInt(player_value["Age"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["sf_age"] = averageNonZeroValues(item["sf_ages"]);

                        //Power Forwards
                        item["pf_values"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 2) ==
                                    "PF"
                                ) {
                                    return parseInt(player_value["Value"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["pf_value"] = item["pf_values"].reduce(
                            (a, b) => a + b,
                            0
                        );

                        item["pf_ages"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 2) ==
                                    "PF"
                                ) {
                                    return parseInt(player_value["Age"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["pf_age"] = averageNonZeroValues(item["pf_ages"]);

                        //Centers
                        item["c_values"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 1) ==
                                    "C"
                                ) {
                                    return parseInt(player_value["Value"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["c_value"] = item["c_values"].reduce(
                            (a, b) => a + b,
                            0
                        );

                        item["c_ages"] = await Promise.all(
                            item["player_details"].map(async (player_value) => {
                                if (player_value["Positions"] == undefined) {
                                    return 0;
                                }
                                if (
                                    player_value["Positions"].substring(0, 1) ==
                                    "C"
                                ) {
                                    return parseInt(player_value["Age"]);
                                } else {
                                    return 0;
                                }
                            })
                        );
                        item["c_age"] = averageNonZeroValues(item["c_ages"]);

                        //Picks
                        let picks = await get_picks(getCookie("leaugeID"));
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

                        item["picks_details"] = picks_details;
                        item["picks_values"] = picks_values;
                        item["picks_value"] = picks_values.reduce(
                            (a, b) => a + b,
                            0
                        );

                        item["player_values"] = item["player_values"].map(
                            (value) => (isNaN(value) ? 0 : value)
                        );

                        item["total_value"] =
                            item["player_values"].reduce((a, b) => a + b, 0) +
                            item["picks_value"];

                        item["record"] = await getRecord(
                            getCookie("leaugeID"),
                            item["owner_id"]
                        );

                        return { ...item, name: owner_name };
                    })
                );

                named_rosters.sort(
                    (a, b) => b["total_value"] - a["total_value"]
                );

                named_rosters = addRankings(named_rosters);

                console.log(
                    named_rosters.find(({ owner_id }) => owner_id == player)
                );
                setRosters(
                    named_rosters.find(({ owner_id }) => owner_id == player)
                );
            });
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case "insights":
                return <Insights userID={player} />;
            case "roster":
                return <Roster rosters={rosters} />;
            case "activity":
                return <Activity userID={player}/>;
            case "trade":
                return <Trade userID={player}/>;
            default:
                return <div>Select a tab to view content.</div>;
        }
    };

    return (
        <div className={styles.page}>
            <h3 className={styles.back}>
                <a className={styles.power} href="/power">
                    Power Rankings
                </a>
                {" >"} {name}
            </h3>
            <div className={styles.topRow}>
                <div>
                    <h2>Team "{teamName}"</h2>
                    <p>Managed by {name}</p>
                </div>
                <h1 className={styles.record}>
                    {record}{" "}
                    <p className={styles.locked}>
                        *If a locked in player is traded mid-week their score
                        will not be reflected
                    </p>
                </h1>
            </div>
            <div className={styles.secondRow}>
                {rosters["owner_id"] != undefined ? (
                    <>
                        <div className={styles.item}>
                            <p className={styles.itemTitle}>Starter Rank</p>
                            <p className={styles.itemRank}>
                                {rosters["starter_value_rank"]}
                            </p>
                        </div>
                        <div className={styles.item}>
                            <p className={styles.itemTitle}>Overall Rank</p>
                            <p className={styles.itemRank}>
                                {rosters["total_value_rank"]}
                            </p>
                        </div>
                        <div className={styles.item}>
                            <p className={styles.itemTitle}>Points For</p>
                            <p className={styles.itemRank}>{totalPoints}</p>
                        </div>
                        <div className={styles.item}>
                            <p className={styles.itemTitle}>Average Points</p>
                            <p className={styles.itemRank}>
                                {parseInt(avgPoints)}
                            </p>
                        </div>
                    </>
                ) : (
                    <></>
                )}
            </div>
            <div className={styles.row3}>
                <nav className={styles.tabNavigation}>
                    <button
                        className={`${styles.tabButton} ${
                            activeTab == "insights" ? styles.active : ""
                        }`}
                        onClick={() => setActiveTab("insights")}
                    >
                        <span className={styles.icon}>
                            <FaChartLine />
                        </span>
                        Insights
                    </button>
                    <button
                        className={`${styles.tabButton} ${
                            activeTab == "roster" ? styles.active : ""
                        }`}
                        onClick={() => setActiveTab("roster")}
                    >
                        <span className={styles.icon}>
                            <HiMiniUserGroup />
                        </span>
                        Roster
                    </button>
                    <button
                        className={`${styles.tabButton} ${
                            activeTab == "activity" ? styles.active : ""
                        }`}
                        onClick={() => setActiveTab("activity")}
                    >
                        <span className={styles.icon}>
                            <BiReceipt />
                        </span>
                        Activity
                    </button>
                    <button
                        className={`${styles.tabButton} ${
                            activeTab == "trade" ? styles.active : ""
                        }`}
                        onClick={() => setActiveTab("trade")}
                    >
                        <span className={styles.icon}>
                            <PiGraphLight />
                        </span>
                        Trade
                    </button>
                </nav>
            </div>
            <div className={styles.tabContent}>{renderTabContent()}</div>
        </div>
    );
}
