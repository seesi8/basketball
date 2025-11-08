import Image from "next/image";
import styles from "../styles/activity.module.css";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";

async function get_team_name(userID) {
    return fetch(
        "/api/team?" +
            new URLSearchParams({
                userID: userID,
                leagueID: getCookie("leagueID"),
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

function get_class_name(player) {
    const getPlayerPoints = player["receivingIDs"]
        .map((player) => parseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);
    const getPicksPoints = player["receivingPicks"]
        .map((player) => parseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);
    const sendPlayerPoints = player["sendingIDs"]
        .map((player) => parseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);
    const sendPicksPoints = player["sendingPicks"]
        .map((player) => parseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);

    const forPoints = getPicksPoints + getPlayerPoints;
    const againstPoints = sendPicksPoints + sendPlayerPoints;

    if (forPoints > againstPoints) {
        return styles.green;
    } else {
        return styles.red;
    }
}

function get_points_differential(player) {
    const getPlayerPoints = player["receivingIDs"]
        .map((player) => parseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);
    const getPicksPoints = player["receivingPicks"]
        .map((player) => parseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);
    const sendPlayerPoints = player["sendingIDs"]
        .map((player) => parseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);
    const sendPicksPoints = player["sendingPicks"]
        .map((player) => parseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);

    const forPoints = getPicksPoints + getPlayerPoints;
    const againstPoints = sendPicksPoints + sendPlayerPoints;

    return Math.abs(forPoints - againstPoints);
}

function get_points_difference(player) {
    const safeParseFloat = (value) =>
        isNaN(parseFloat(value)) ? 0 : parseFloat(value);

    const getPlayerPoints = player["receivingIDs"]
        .map((player) => safeParseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);

    const getPicksPoints = player["receivingPicks"]
        .map((player) => safeParseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);

    const sendPlayerPoints = player["sendingIDs"]
        .map((player) => safeParseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);

    const sendPicksPoints = player["sendingPicks"]
        .map((player) => safeParseFloat(player["Value"]))
        .reduce((a, b) => a + b, 0);

    const forPoints = getPicksPoints + getPlayerPoints;
    const againstPoints = sendPicksPoints + sendPlayerPoints;

    return forPoints - againstPoints;
}

async function get_activity(userID) {
    return fetch(
        "/api/transactions?" +
            new URLSearchParams({
                userID: userID,
                leagueID: getCookie("leagueID"),
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value;
        });
}

function contains(value, input) {
    const is =
        value["receivingIDs"]
            .map((value) => value.Name)
            .some((item) => typeof item === "string" && item.includes(input)) ||
        value["receivingPicks"]
            .map((value) => value.Name)
            .some((item) => typeof item === "string" && item.includes(input)) ||
        value["sendingIDs"]
            .map((value) => value.Name)
            .some((item) => typeof item === "string" && item.includes(input)) ||
        value["sendingPicks"]
            .map((value) => value.Name)
            .some((item) => typeof item === "string" && item.includes(input));
    return is;
}

export default function Activity({ userID }) {
    const [teamName, setTeamName] = useState("");
    const [transactions, setTransactions] = useState("");
    const [input, setInput] = useState("");

    useEffect(() => {
        get_team_name(userID).then((value) => {
            setTeamName(value);
        });

        get_activity(userID).then((value) => {
            setTransactions(value);
        });
    }, []);

    return (
        <div className={styles.page}>
            {" "}
            <h3 className={styles.title}>Activity Feed</h3>
            <p className={styles.recent}>Recent moves by {teamName}</p>
            <input
                placeholder="Search Activities"
                value={input}
                id=""
                className={styles.input}
                onChange={(e) => setInput(e.target.value)}
            />
            <div className={styles.tiles}>
                <div className={styles.tile}>
                    <p>Total Moves</p>
                    <h3 className={styles.bold}>
                        {transactions != "" ? transactions.length : ""}
                    </h3>
                </div>
                <div className={styles.tile}>
                    <p>Total Trades</p>
                    <h3 className={styles.bold}>
                        {transactions != ""
                            ? transactions.filter(
                                  (value) => value["type"] == "trade"
                              ).length
                            : ""}
                    </h3>
                </div>
                <div className={styles.tile}>
                    <p>Net Value Added</p>
                    <h3 className={styles.bold}>
                        {transactions != ""
                            ? parseInt(
                                  transactions
                                      .map((value) =>
                                          get_points_difference(value)
                                      )
                                      .reduce((a, b) => a + b, 0)
                              )
                            : ""}
                    </h3>
                </div>
            </div>
            <dir className={styles.transactionsContainer}>
                <div className={styles.transactions}>
                    {transactions != "" ? (
                        <>
                            {transactions.map((value) => {
                                if (!contains(value, input)) {
                                    return <></>;
                                }
                                return (
                                    <div className={styles.transaction}>
                                        <div className={styles.playerContainer}>
                                            <h3 className={styles.type}>
                                                {value["type"] === "trade"
                                                    ? `Trade with ${value["toTeamName"]}`
                                                    : "Free Agent Signing"}
                                            </h3>
                                            <h3
                                                className={get_class_name(
                                                    value
                                                )}
                                            >
                                                {parseInt(
                                                    get_points_differential(
                                                        value
                                                    )
                                                )}
                                            </h3>
                                        </div>
                                        {value["receivingIDs"].map((player) => {
                                            return (
                                                <div
                                                    className={
                                                        styles.playerContainer
                                                    }
                                                >
                                                    <p
                                                        className={
                                                            styles.player
                                                        }
                                                    >
                                                        + {player["Name"]}
                                                    </p>
                                                    <p className={styles.value}>
                                                        {parseInt(
                                                            player["Value"]
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                        {value["receivingPicks"].map(
                                            (player) => {
                                                return (
                                                    <div
                                                        className={
                                                            styles.playerContainer
                                                        }
                                                    >
                                                        <p
                                                            className={
                                                                styles.player
                                                            }
                                                        >
                                                            + {player["Name"]}
                                                        </p>
                                                        <p
                                                            className={
                                                                styles.value
                                                            }
                                                        >
                                                            {parseInt(
                                                                player["Value"]
                                                            )}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                        )}
                                        {value["sendingIDs"].map((player) => {
                                            return (
                                                <div
                                                    className={
                                                        styles.playerContainer
                                                    }
                                                >
                                                    <p
                                                        className={
                                                            styles.player
                                                        }
                                                    >
                                                        - {player["Name"]}
                                                    </p>
                                                    <p className={styles.value}>
                                                        {parseInt(
                                                            player["Value"]
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                        {value["sendingPicks"].map((player) => {
                                            return (
                                                <div
                                                    className={
                                                        styles.playerContainer
                                                    }
                                                >
                                                    <p
                                                        className={
                                                            styles.player
                                                        }
                                                    >
                                                        - {player["Name"]}
                                                    </p>
                                                    <p className={styles.value}>
                                                        {parseInt(
                                                            player["Value"]
                                                        )}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </>
                    ) : (
                        ""
                    )}
                </div>
            </dir>
        </div>
    );
}
