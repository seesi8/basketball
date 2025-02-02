"use client";

import Image from "next/image";
import styles from "../styles/calculator.module.css";
import { useEffect, useState, useRef } from "react";
import { getCookie, setCookie } from "cookies-next/client";
import { IoInformationCircleOutline } from "react-icons/io5";

function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            var r = (Math.random() * 16) | 0,
                v = c == "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

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

function loosing_roster(
    roster,
    roster2,
    roster3,
    roster4,
    team1ValueAdjustment,
    team2ValueAdjustment
) {
    if (
        sumArray(roster.map((player) => parseInt(player.value))) +
            team1ValueAdjustment <
        sumArray(roster2.map((player) => parseInt(player.value))) +
            team2ValueAdjustment
    ) {
        return roster3;
    } else {
        return roster4;
    }
}

function roster_difforence(
    roster,
    roster2,
    team1ValueAdjustment,
    team2ValueAdjustment
) {
    return Math.abs(
        sumArray(roster.map((player) => parseInt(player.value))) +
            team1ValueAdjustment -
            (sumArray(roster2.map((player) => parseInt(player.value))) +
                team2ValueAdjustment)
    );
}

function areWithinTenPercent(num1, num2) {
    // Calculate the difference
    const difference = Math.abs(num1 - num2);

    // Calculate 10% of the larger number
    const tenPercent = Math.max(num1, num2) * 0.2;

    // Check if the difference is within 10%
    return difference <= tenPercent;
}

function sumArray(numbers) {
    if (!Array.isArray(numbers)) {
        throw new Error("Input must be an array.");
    }

    return numbers.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
    );
}

async function get_picks(userID) {
    const response = await fetch(
        "/api/picks?" +
            new URLSearchParams({
                leaugeID: getCookie("leaugeID"),
            }).toString()
    );
    const data = await response.json();

    for (const roster of data) {
        if (roster["owner_id"] === userID) {
            return roster["picks"];
        }
    }

    // Return null or some default if no match is found
    return null;
}

function get_top_free_agents(rosters, all_players, l = 1, s = 0) {
    if (rosters.length == 0 || all_players.length == 0) {
        return [];
    } else {
        const rostered_players = rosters
            .map((player) => {
                return player["players"];
            })
            .flat();
        const unrostered_players = all_players
            .filter((player) => {
                return (
                    !rostered_players.includes(player["original_key"]) &&
                    player["Positions"] != "P"
                );
            })
            .sort((a, b) => b["Value"] - a["Value"]);
        const max_player = unrostered_players.slice(s, l + s);
        return max_player;
    }
}

export default function Calculator() {
    const [rosters, setRosters] = useState([]);
    const [theLoosingRoster, setTheLoosingRoster] = useState([]);
    const [team1Name, setTeam1Name] = useState("");
    const [team2Name, setTeam2Name] = useState("");
    const [team1, setTeam1] = useState("");
    const [team2, setTeam2] = useState("");
    const [team1Players, setTeam1Players] = useState([]);
    const [team2Players, setTeam2Players] = useState([]);
    const [currentTeam1Input, setCurrentTeam1Input] = useState("");
    const [currentTeam2Input, setCurrentTeam2Input] = useState("");
    const [team1Active, setTeam1Active] = useState(false);
    const [team2Active, setTeam2Active] = useState(false);
    const [team1Info, setTeam1Info] = useState(false);
    const [team2Info, setTeam2Info] = useState(false);
    const [team1Adjustments, setTeam1Adjustments] = useState([]);
    const [team2Adjustments, setTeam2Adjustments] = useState([]);
    const [team1Selected, setTeam1Selected] = useState([]);
    const [team2Selected, setTeam2Selected] = useState([]);
    const [team1ValueAdjustment, setTeam1ValueAdjustment] = useState(0);
    const [team2ValueAdjustment, setTeam2ValueAdjustment] = useState(0);
    const [filter, setFilter] = useState(true);
    const [allPlayers, setAllPlayers] = useState([]);
    const innerRef = useRef(null);
    const outerRef = useRef(null);
    const [targetHeight, setTargetHeight] = useState(0);

    useEffect(() => {
        const updateHeight = () => {
            if (innerRef.current) {
                setTargetHeight(innerRef.current.offsetHeight);
            } else {
                setTargetHeight(0); // Fallback height if ref is removed
            }
        };

        // Update height initially and whenever ref changes
        updateHeight();

        // Optional: Use a MutationObserver if the ref dynamically appears/disappears
        const observer = new MutationObserver(updateHeight);
        if (innerRef.current) {
            observer.observe(innerRef.current, {
                attributes: true,
                childList: true,
                subtree: true,
            });
        }

        return () => {
            observer.disconnect();
        };
    }, [innerRef.current, team1Info, team2Info]);

    const fetchTeamPlayers = async (team, setFunc) => {
        for (let roster_id in rosters) {
            let roster = rosters[roster_id];
            if (roster["owner_id"] === team) {
                const players = (
                    await Promise.all(
                        roster["players"].map(async (player_id) => {
                            let data = await get_player(player_id);
                            if (data == undefined) {
                                return undefined;
                            }
                            return {
                                name: data["Name"],
                                value: parseFloat(data["Value"]),
                                team: data["Team"],
                                age: data["Age"],
                                positions: data["Positions"],
                                id: player_id,
                            };
                        })
                    )
                ).filter((e) => e !== undefined);
                let picks = await Promise.all(
                    (
                        await get_picks(team)
                    ).map(async (player_id) => {
                        let data = await get_player(player_id);
                        return {
                            name: data["Name"],
                            value: parseFloat(data["Value"]),
                            team: data["Team"],
                            age: data["Age"],
                            positions: data["Positions"],
                            id: player_id,
                        };
                    })
                );
                setFunc(
                    [...picks, ...players].sort((a, b) => b.value - a.value)
                );
            }
        }
    };

    const fetchAllPlayers = async () => {
        fetch("/api/all_players")
            .then((res) => res.json())
            .then((json) => {
                setAllPlayers(
                    json.map((data) => {
                        return data;
                    })
                );
            });
    };

    useEffect(() => {
        fetchAllPlayers();
    }, []);

    useEffect(() => {
        setTeam1ValueAdjustment(0);
        setTeam2ValueAdjustment(0);
        if (rosters.length < 1 || allPlayers.length < 1) {
            return;
        }

        let at_free_agent = 0;
        let team1Adjustments = [];
        let team2Adjustments = [];

        const replacements1 = get_top_free_agents(
            rosters,
            allPlayers,
            team1Selected.length,
            at_free_agent
        )
            .sort((a, b) => b["Value"] - a["Value"])
            .map((data) => {
                return {
                    name: data["Name"],
                    value: parseFloat(data["Value"]),
                    team: data["Team"],
                    age: data["Age"],
                    positions: data["Positions"],
                    id: data["original_key"],
                };
            });

        const sorted_team1 = [...team1Selected].sort(
            (a, b) => a["value"] - b["value"]
        );

        const new_team_1 = sorted_team1.map((player, i) => {
            if (replacements1[at_free_agent]["value"] > player["value"]) {
                at_free_agent += 1;
                team1Adjustments.push({
                    add: replacements1[at_free_agent - 1],
                    drop: player,
                });
                return replacements1[at_free_agent - 1];
            } else {
                return player;
            }
        });

        const replacements2 = get_top_free_agents(
            rosters,
            allPlayers,
            team2Selected.length + at_free_agent,
            0
        )
            .sort((a, b) => b["Value"] - a["Value"])
            .map((data) => {
                return {
                    name: data["Name"],
                    value: parseFloat(data["Value"]),
                    team: data["Team"],
                    age: data["Age"],
                    positions: data["Positions"],
                    id: data["original_key"],
                };
            });

        const sorted_team2 = [...team2Selected].sort(
            (a, b) => a["value"] - b["value"]
        );

        const new_team_2 = sorted_team2.map((player, i) => {
            if (replacements2[at_free_agent]["value"] > player["value"]) {
                at_free_agent += 1;
                team2Adjustments.push({
                    add: replacements2[at_free_agent - 1],
                    drop: player,
                });
                return replacements2[at_free_agent - 1];
            } else {
                return player;
            }
        });

        const new_team1_value_increase =
            new_team_1.reduce((a, b) => {
                return a + b["value"];
            }, 0) -
            team1Selected.reduce((a, b) => {
                return a + b["value"];
            }, 0);
        const new_team2_value_increase =
            new_team_2.reduce((a, b) => {
                return a + b["value"];
            }, 0) -
            team2Selected.reduce((a, b) => {
                return a + b["value"];
            }, 0);

        const team1Filtered = team1Selected.filter(
            (item) => item["positions"] != "P"
        );
        const team2Filtered = team2Selected.filter(
            (item) => item["positions"] != "P"
        );

        const playerDiff = Math.abs(
            team1Filtered.length - team2Filtered.length
        );

        const topAgents = get_top_free_agents(
            rosters,
            allPlayers,
            playerDiff,
            at_free_agent
        );

        let valueAdjust;
        if (topAgents.length < 1) {
            valueAdjust = 0;
        } else {
            valueAdjust = topAgents.reduce((a, b) => {
                return a + parseFloat(b["Value"]);
            }, 0);
        }

        if (team1Filtered.length > team2Filtered.length) {
            topAgents.forEach((data) => {
                const item = {
                    name: data["Name"],
                    value: parseFloat(data["Value"]),
                    team: data["Team"],
                    age: data["Age"],
                    positions: data["Positions"],
                    id: data["original_key"],
                };
                team2Adjustments.push({
                    add: item,
                });
            });

            setTeam2ValueAdjustment(valueAdjust + new_team2_value_increase);

            setTeam1ValueAdjustment(new_team1_value_increase);
        } else {
            topAgents.forEach((data) => {
                const item = {
                    name: data["Name"],
                    value: parseFloat(data["Value"]),
                    team: data["Team"],
                    age: data["Age"],
                    positions: data["Positions"],
                    id: data["original_key"],
                };
                team1Adjustments.push({
                    add: item,
                });
            });
            setTeam1ValueAdjustment(valueAdjust + new_team1_value_increase);

            setTeam2ValueAdjustment(new_team2_value_increase);
        }

        setTeam1Adjustments(team1Adjustments);
        setTeam2Adjustments(team2Adjustments);
    }, [rosters, allPlayers, team1Selected, team2Selected]);

    function evenTeams(
        team1Selected,
        team2Selected,
        team1ValueAdjustment,
        team2ValueAdjustment,
        rosters,
        allPlayers
    ) {
        // Helper function to calculate team value
        const calculateTeamValue = (team, adjustment) => {
            return (
                team.reduce((sum, player) => sum + player.value, 0) + adjustment
            );
        };

        // Helper function to simulate the useEffect logic
        const simulateUseEffect = (team1, team2, rosters, allPlayers) => {
            // Simulate the useEffect logic here (e.g., adding free agents, recalculating adjustments)
            // This is a simplified version of your useEffect logic
            let at_free_agent = 0;
            let team1Adjustments = [];
            let team2Adjustments = [];

            // Simulate replacements for Team 1
            const replacements1 = get_top_free_agents(
                rosters,
                allPlayers,
                team1.length,
                at_free_agent
            )
                .sort((a, b) => b["Value"] - a["Value"])
                .map((data) => ({
                    name: data["Name"],
                    value: parseFloat(data["Value"]),
                    team: data["Team"],
                    age: data["Age"],
                    positions: data["Positions"],
                    id: data["original_key"],
                }));

            const sorted_team1 = [...team1].sort(
                (a, b) => a["value"] - b["value"]
            );
            const new_team_1 = sorted_team1.map((player, i) => {
                if (replacements1[at_free_agent]?.value > player.value) {
                    at_free_agent += 1;
                    team1Adjustments.push({
                        add: replacements1[at_free_agent - 1],
                        drop: player,
                    });
                    return replacements1[at_free_agent - 1];
                } else {
                    return player;
                }
            });

            // Simulate replacements for Team 2
            const replacements2 = get_top_free_agents(
                rosters,
                allPlayers,
                team2.length + at_free_agent,
                0
            )
                .sort((a, b) => b["Value"] - a["Value"])
                .map((data) => ({
                    name: data["Name"],
                    value: parseFloat(data["Value"]),
                    team: data["Team"],
                    age: data["Age"],
                    positions: data["Positions"],
                    id: data["original_key"],
                }));

            const sorted_team2 = [...team2].sort(
                (a, b) => a["value"] - b["value"]
            );
            const new_team_2 = sorted_team2.map((player, i) => {
                if (replacements2[at_free_agent]?.value > player.value) {
                    at_free_agent += 1;
                    team2Adjustments.push({
                        add: replacements2[at_free_agent - 1],
                        drop: player,
                    });
                    return replacements2[at_free_agent - 1];
                } else {
                    return player;
                }
            });

            // Return the new teams and adjustments
            return {
                new_team_1,
                new_team_2,
                team1Adjustments,
                team2Adjustments,
            };
        };

        // Calculate initial team values
        let team1Value = calculateTeamValue(
            team1Selected,
            team1ValueAdjustment
        );
        let team2Value = calculateTeamValue(
            team2Selected,
            team2ValueAdjustment
        );

        // Determine which team is weaker
        const weakerTeam =
            team1Value < team2Value ? team1Selected : team2Selected;
        const strongerTeam =
            team1Value < team2Value ? team2Selected : team1Selected;

        // Calculate the initial difference
        let difference = Math.abs(team1Value - team2Value);

        // Simulate adding a player of value `difference` to the weaker team
        const hypotheticalPlayer = { value: difference };
        const updatedWeakerTeam = [...weakerTeam, hypotheticalPlayer];

        // Simulate the useEffect logic after adding the hypothetical player
        const { new_team_1, new_team_2 } = simulateUseEffect(
            team1Value < team2Value ? updatedWeakerTeam : strongerTeam,
            team1Value < team2Value ? strongerTeam : updatedWeakerTeam,
            rosters,
            allPlayers
        );

        // Recalculate team values after adjustments
        const updatedTeam1Value = calculateTeamValue(
            new_team_1,
            team1ValueAdjustment
        );
        const updatedTeam2Value = calculateTeamValue(
            new_team_2,
            team2ValueAdjustment
        );

        // Calculate the new difference
        const newDifference = Math.abs(updatedTeam1Value - updatedTeam2Value);

        // If the teams are still not balanced, adjust the hypothetical player's value
        if (newDifference > 0) {
            difference += newDifference;
        }

        return difference;
    }

    useEffect(() => {
        setTheLoosingRoster(
            loosing_roster(
                team1Selected,
                team2Selected,
                team1Players,
                team2Players,
                team1ValueAdjustment,
                team2ValueAdjustment
            ).filter((player) => {
                return (
                    player["value"] <
                        evenTeams(
                            team1Selected,
                            team2Selected,
                            team1ValueAdjustment,
                            team2ValueAdjustment,
                            rosters,
                            allPlayers
                        ) *
                            1.1 &&
                    !loosing_roster(
                        team1Selected,
                        team2Selected,
                        team1Selected,
                        team2Selected,
                        team1ValueAdjustment,
                        team2ValueAdjustment
                    ).some((item) => item.id === player.id)
                );
            })
        );
    }, [
        team1Selected,
        team2Selected,
        team1ValueAdjustment,
        team2ValueAdjustment,
    ]);

    useEffect(() => {
        fetch(
            "/api/rosters?" +
                new URLSearchParams({
                    leaugeID: getCookie("leaugeID"),
                }).toString()
        )
            .then((res) => res.json())
            .then(async (value) => {
                const new_rosters = await Promise.all(
                    value.map(async (roster) => {
                        let new_roster = { ...roster };
                        new_roster["name"] = await get_name(roster["owner_id"]);
                        return new_roster;
                    })
                );
                setTeam1(new_rosters[0]["owner_id"]);
                setTeam2(new_rosters[1]["owner_id"]);
                setRosters(new_rosters);
            });
    }, []);

    useEffect(() => {
        get_name(team1).then((data) => {
            setTeam1Name(data);
        });

        setTeam1Selected([]);

        if (filter) {
            fetchTeamPlayers(team1, setTeam1Players); // Call the async function
        } else {
            setTeam1Players(
                allPlayers.map((player) => {
                    return {
                        name: player["Name"],
                        value: parseFloat(player["Value"]),
                        team: player["Team"],
                        age: player["Age"],
                        positions: player["Positions"],
                        id: player["original_key"],
                    };
                })
            );
        }
    }, [team1, rosters, filter]);

    useEffect(() => {
        get_name(team2).then((data) => {
            setTeam2Name(data);
        });

        setTeam2Selected([]);

        if (filter) {
            fetchTeamPlayers(team2, setTeam2Players); // Call the async function
        } else {
            setTeam2Players(
                allPlayers.map((player) => {
                    return {
                        name: player["Name"],
                        value: parseFloat(player["Value"]),
                        team: player["Team"],
                        age: player["Age"],
                        positions: player["Positions"],
                        id: player["original_key"],
                    };
                })
            );
        }
    }, [team2, rosters, filter]);

    const get_player = async (playerID) => {
        if (playerID.includes("|")) {
            return fetch(
                `/api/value?` +
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

        return allPlayers.find(({ original_key }) => original_key === playerID);
    };

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Fantasy Football Trade Calculator</h1>
            <p>
                Build fantasy dynasty trades with our trade calculator. Log into
                your league and the fantasy trade analyzer will update based on
                your league's rosters.
            </p>
            <div className={styles.settings}>
                <label className={styles.label}>
                    Filter Rosters:
                    <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={filter}
                        onChange={(e) => setFilter(!filter)}
                    />
                </label>
            </div>
            <div className={styles.calculator}>
                <div className={styles.team1}>
                    <div className={styles.container}>
                        <select
                            className={styles.dropdown}
                            value={team1}
                            onChange={(e) => setTeam1(e.target.value)}
                        >
                            {rosters.map((roster) => {
                                return (
                                    <option value={roster["owner_id"]}>
                                        {roster["name"]}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div className={styles.container}>
                        <input
                            type="text"
                            placeholder="Search Player"
                            name=""
                            id=""
                            className={styles.input}
                            value={currentTeam1Input}
                            onChange={(e) => {
                                setCurrentTeam1Input(e.target.value);
                            }}
                            onFocus={(e) => setTeam1Active(true)}
                            onBlur={(e) => {
                                setTeam1Active(false);
                            }}
                        />
                        {team1Active ? (
                            <div className={styles.options}>
                                {team1Players.map((player) => {
                                    if (player["name"] == undefined) {
                                        return;
                                    }
                                    if (
                                        player["name"]
                                            .toLowerCase()
                                            .includes(
                                                currentTeam1Input.toLowerCase()
                                            ) &&
                                        (!team1Selected
                                            .map((player) => player["id"])
                                            .includes(player["id"]) ||
                                            !filter)
                                    ) {
                                        return (
                                            <div
                                                className={
                                                    styles.playerContainer
                                                }
                                                onMouseDown={(e) => {
                                                    setTeam1Selected([
                                                        ...team1Selected,
                                                        {
                                                            ...player,
                                                            uuid: uuid(),
                                                        },
                                                    ]);
                                                }}
                                            >
                                                <p
                                                    className={
                                                        styles.playerName
                                                    }
                                                >
                                                    {player["name"]}
                                                </p>
                                                <p className={styles.right}>
                                                    {parseInt(player["value"])}
                                                </p>
                                                <p className={styles.position}>
                                                    {player["positions"]}{" "}
                                                    {team2Name}
                                                </p>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                    {team1Selected.map((player) => {
                        return (
                            <div className={styles.selectedCard}>
                                <p>{player["name"]}</p>
                                <p className={styles.info}>
                                    {player["team"]} {player["age"]} y.o
                                </p>
                                <p>{parseInt(player["value"])}</p>
                                <button
                                    className={styles.remove}
                                    onClick={(e) => {
                                        const newSelected =
                                            team1Selected.filter(
                                                (newPlayer) =>
                                                    newPlayer["uuid"] !==
                                                    player["uuid"]
                                            );
                                        setTeam1Selected(newSelected);
                                    }}
                                >
                                    X
                                </button>
                            </div>
                        );
                    })}
                    <div className={styles.valueAdjustContainer}>
                        <div className={styles.valueAdjustRow}>
                            Value Adjustment:{" "}
                            <span className={styles.valueAdjust}>
                                +{parseInt(team1ValueAdjustment)}
                            </span>
                            <button
                                className={styles.infoButton}
                                onClick={(e) => setTeam1Info(!team1Info)}
                            >
                                <IoInformationCircleOutline />
                            </button>
                        </div>
                        {team1Info ? (
                            <div>
                                <hr className={styles.infoBreak} />
                                <div
                                    className={styles.valueDescriptionContainer}
                                    ref={outerRef}
                                    style={{
                                        height: `${targetHeight}px`,
                                    }}
                                >
                                    <p
                                        className={styles.valueDescription}
                                        ref={innerRef}
                                    >
                                        Value Adjustment is calculated based on
                                        a set of transactions that the receiving
                                        teams should enact upon the completion
                                        of the trade. Each transaction is listed
                                        below. Transactions can include: picking
                                        up free agents with newly aquired roster
                                        spots and exchanging trade pieces for
                                        free agents with a greater value.
                                    </p>
                                </div>
                                {team1Adjustments.map((adjustment) => {
                                    return (
                                        <div className={styles.adjustment}>
                                            {adjustment.hasOwnProperty(
                                                "add"
                                            ) ? (
                                                <p className={styles.addName}>
                                                    {"+ " +
                                                        adjustment["add"][
                                                            "name"
                                                        ]}{" "}
                                                </p>
                                            ) : (
                                                <></>
                                            )}
                                            {adjustment.hasOwnProperty(
                                                "drop"
                                            ) ? (
                                                <p className={styles.dropName}>
                                                    {"- " +
                                                        adjustment["drop"][
                                                            "name"
                                                        ]}{" "}
                                                </p>
                                            ) : (
                                                <></>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>
                    <div
                        className={styles.totalContainer}
                        style={{
                            color: areWithinTenPercent(
                                sumArray(
                                    team1Selected.map((player) =>
                                        parseInt(player.value)
                                    )
                                ),
                                sumArray(
                                    team2Selected.map((player) =>
                                        parseInt(player.value)
                                    )
                                )
                            )
                                ? "white"
                                : "#CC7D82",
                        }}
                    >
                        <p className={styles.selected}>
                            {team1Selected.length} pieces{" "}
                        </p>
                        <p className={styles.sum}>
                            {sumArray(
                                team1Selected.map((player) =>
                                    parseInt(player.value)
                                )
                            ) + parseInt(team1ValueAdjustment)}
                        </p>
                    </div>
                    <h2 className={styles.summary}>
                        {team1Name}:{" "}
                        {sumArray(
                            team1Selected.map((player) =>
                                parseInt(player.value)
                            )
                        ) + parseInt(team1ValueAdjustment)}
                    </h2>
                </div>
                <div className={styles.team2}>
                    <div className={styles.container}>
                        <select
                            className={styles.dropdown}
                            value={team2}
                            onChange={(e) => setTeam2(e.target.value)}
                        >
                            {rosters.map((roster) => {
                                return (
                                    <option value={roster["owner_id"]}>
                                        {roster["name"]}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div className={styles.container}>
                        <input
                            type="text"
                            name=""
                            id=""
                            className={styles.input}
                            placeholder="Search Player"
                            value={currentTeam2Input}
                            onChange={(e) => {
                                setCurrentTeam2Input(e.target.value);
                            }}
                            onFocus={(e) => setTeam2Active(true)}
                            onBlur={(e) => {
                                setTeam2Active(false);
                            }}
                        />
                        {team2Active ? (
                            <div className={styles.options}>
                                {team2Players.map((player) => {
                                    if (player["name"] == undefined) {
                                        return;
                                    }
                                    if (
                                        player["name"]
                                            .toLowerCase()
                                            .includes(
                                                currentTeam2Input.toLowerCase()
                                            ) &&
                                        (!team2Selected
                                            .map((player) => player["id"])
                                            .includes(player["id"]) ||
                                            !filter)
                                    ) {
                                        return (
                                            <div
                                                className={
                                                    styles.playerContainer
                                                }
                                                onMouseDown={(e) => {
                                                    setTeam2Selected([
                                                        ...team2Selected,
                                                        {
                                                            ...player,
                                                            uuid: uuid(),
                                                        },
                                                    ]);
                                                }}
                                            >
                                                <p
                                                    className={
                                                        styles.playerName
                                                    }
                                                >
                                                    {player["name"]}
                                                </p>
                                                <p className={styles.right}>
                                                    {parseInt(player["value"])}
                                                </p>
                                                <p className={styles.position}>
                                                    {player["positions"]}{" "}
                                                    {team2Name}
                                                </p>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                    {team2Selected.map((player) => {
                        return (
                            <div className={styles.selectedCard}>
                                <p>{player["name"]}</p>
                                <p className={styles.info}>
                                    {player["team"]} {player["age"]} y.o
                                </p>
                                <p>{parseInt(player["value"])}</p>
                                <button
                                    className={styles.remove}
                                    onClick={(e) => {
                                        const newSelected =
                                            team2Selected.filter(
                                                (newPlayer) =>
                                                    newPlayer["uuid"] !==
                                                    player["uuid"]
                                            );
                                        setTeam2Selected(newSelected);
                                    }}
                                >
                                    X
                                </button>
                            </div>
                        );
                    })}
                    <div className={styles.valueAdjustContainer}>
                        <div className={styles.valueAdjustRow}>
                            Value Adjustment:{" "}
                            <span className={styles.valueAdjust}>
                                +{parseInt(team2ValueAdjustment)}
                            </span>
                            <button
                                className={styles.infoButton}
                                onClick={(e) => setTeam2Info(!team2Info)}
                            >
                                <IoInformationCircleOutline />
                            </button>
                        </div>
                        {team2Info ? (
                            <div>
                                <hr className={styles.infoBreak} />

                                <div
                                    className={styles.valueDescriptionContainer}
                                    ref={outerRef}
                                    style={{
                                        height: `${targetHeight}px`,
                                    }}
                                >
                                    <p
                                        className={styles.valueDescription}
                                        ref={innerRef}
                                    >
                                        Value Adjustment is calculated based on
                                        a set of transactions that the receiving
                                        teams should enact upon the completion
                                        of the trade. Each transaction is listed
                                        below. Transactions can include: picking
                                        up free agents with newly aquired roster
                                        spots and exchanging trade pieces for
                                        free agents with a greater value.
                                    </p>
                                </div>
                                {console.log(team2Adjustments)}
                                {team2Adjustments.map((adjustment) => {
                                    return (
                                        <div className={styles.adjustment}>
                                            {adjustment.hasOwnProperty(
                                                "add"
                                            ) ? (
                                                <p className={styles.addName}>
                                                    {"+ " +
                                                        adjustment["add"][
                                                            "name"
                                                        ]}{" "}
                                                </p>
                                            ) : (
                                                <></>
                                            )}
                                            {adjustment.hasOwnProperty(
                                                "drop"
                                            ) ? (
                                                <p className={styles.dropName}>
                                                    {"- " +
                                                        adjustment["drop"][
                                                            "name"
                                                        ]}{" "}
                                                </p>
                                            ) : (
                                                <></>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>
                    <div
                        className={styles.totalContainer}
                        style={{
                            color: areWithinTenPercent(
                                sumArray(
                                    team1Selected.map((player) =>
                                        parseInt(player.value)
                                    )
                                ),
                                sumArray(
                                    team2Selected.map((player) =>
                                        parseInt(player.value)
                                    )
                                )
                            )
                                ? "white"
                                : "#CC7D82",
                        }}
                    >
                        <p className={styles.selected}>
                            {team2Selected.length} pieces{" "}
                        </p>
                        <p className={styles.sum}>
                            {sumArray(
                                team2Selected.map((player) =>
                                    parseInt(player.value)
                                )
                            ) + parseInt(team2ValueAdjustment)}
                        </p>
                    </div>
                    <h2 className={styles.summary}>
                        {team2Name}:{" "}
                        {sumArray(
                            team2Selected.map((player) =>
                                parseInt(player.value)
                            )
                        ) + parseInt(team2ValueAdjustment)}
                    </h2>
                </div>
            </div>
            <div
                className={styles.favors}
                style={{
                    backgroundColor: areWithinTenPercent(
                        sumArray(
                            team1Selected.map((player) =>
                                parseInt(player.value)
                            )
                        ) + parseInt(team1ValueAdjustment),
                        sumArray(
                            team2Selected.map((player) =>
                                parseInt(player.value)
                            )
                        ) + parseInt(team2ValueAdjustment)
                    )
                        ? "#484863"
                        : "#CC7D82",
                }}
            >
                <h2 className={styles.trade}>
                    {areWithinTenPercent(
                        sumArray(
                            team1Selected.map((player) =>
                                parseInt(player.value)
                            )
                        ) + parseInt(team1ValueAdjustment),
                        sumArray(
                            team2Selected.map((player) =>
                                parseInt(player.value)
                            )
                        ) + parseInt(team2ValueAdjustment)
                    )
                        ? "Fair Trade"
                        : `Favors: ${
                              sumArray(
                                  team1Selected.map((player) =>
                                      parseInt(player.value)
                                  )
                              ) +
                                  parseInt(team1ValueAdjustment) >
                              sumArray(
                                  team2Selected.map((player) =>
                                      parseInt(player.value)
                                  )
                              ) +
                                  parseInt(team2ValueAdjustment)
                                  ? team2Name
                                  : team1Name
                          }`}
                </h2>
                {areWithinTenPercent(
                    sumArray(
                        team1Selected.map((player) => parseInt(player.value))
                    ) + parseInt(team1ValueAdjustment),
                    sumArray(
                        team2Selected.map((player) => parseInt(player.value))
                    ) + parseInt(team2ValueAdjustment)
                ) ? (
                    ""
                ) : (
                    <p className={styles.add}>
                        Add a player with{" "}
                        <span className={styles.bold}>
                            {parseInt(
                                Math.abs(
                                    evenTeams(
                                        team1Selected,
                                        team2Selected,
                                        team1ValueAdjustment,
                                        team2ValueAdjustment,
                                        rosters,
                                        allPlayers
                                    )
                                )
                            )}
                        </span>{" "}
                        value to even trade
                    </p>
                )}
            </div>
            <div className={styles.tiles}>
                {areWithinTenPercent(
                    sumArray(
                        team1Selected.map((player) => parseInt(player.value))
                    ) + parseInt(team1ValueAdjustment),
                    sumArray(
                        team2Selected.map((player) => parseInt(player.value))
                    ) + parseInt(team2ValueAdjustment)
                )
                    ? ""
                    : theLoosingRoster.length > 0 && (
                          <div className={styles.playersAdd}>
                              <h3 className={styles.toAddTitle}>
                                  Players to even the trade from{" "}
                                  {sumArray(
                                      team1Selected.map((player) =>
                                          parseInt(player.value)
                                      )
                                  ) +
                                      parseInt(team1ValueAdjustment) >
                                  sumArray(
                                      team2Selected.map((player) =>
                                          parseInt(player.value)
                                      )
                                  ) +
                                      parseInt(team2ValueAdjustment)
                                      ? team2Name
                                      : team1Name}
                              </h3>
                              {theLoosingRoster
                                  .slice(0, 5)
                                  .map((player, index) => {
                                      return (
                                          <div
                                              className={styles.playerToEven}
                                              key={player["name"]}
                                              onMouseDown={(e) => {
                                                  if (
                                                      sumArray(
                                                          team1Selected.map(
                                                              (player) =>
                                                                  parseInt(
                                                                      player.value
                                                                  )
                                                          )
                                                      ) +
                                                          parseInt(
                                                              team1ValueAdjustment
                                                          ) >
                                                      sumArray(
                                                          team2Selected.map(
                                                              (player) =>
                                                                  parseInt(
                                                                      player.value
                                                                  )
                                                          )
                                                      ) +
                                                          parseInt(
                                                              team2ValueAdjustment
                                                          )
                                                  ) {
                                                      setTeam2Selected([
                                                          ...team2Selected,
                                                          player,
                                                      ]);
                                                  } else {
                                                      setTeam1Selected([
                                                          ...team1Selected,
                                                          player,
                                                      ]);
                                                  }
                                              }}
                                          >
                                              <p>{player["name"]}</p>
                                              <p>{parseInt(player["value"])}</p>
                                          </div>
                                      );
                                  })}
                          </div>
                      )}
            </div>
        </div>
    );
}
