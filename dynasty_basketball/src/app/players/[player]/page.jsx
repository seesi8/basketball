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
import { get_name, getFormatedRosters } from "@/app/helpers/functions";
//get_name

async function get_record(userID) {
    return fetch(
        "/api/record?" +
            new URLSearchParams({
                leagueID: getCookie("leagueID"),
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value[userID];
        });
}

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

async function total_points(userID) {
    return fetch(
        "/api/points?" +
            new URLSearchParams({
                userID: userID,
                leagueID: getCookie("leagueID"),
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
            if (!isNaN(parseFloat(value))) {
                setTotalPoints(value);
            } else {
                setTotalPoints(0);
            }
            setAvgPoints(value / (await getWeek()));
        });
    }, []);

    // Set Rosters
    useEffect(() => {
        fetch(
            "/api/rosters?" +
                new URLSearchParams({
                    leagueID: getCookie("leagueID"),
                }).toString()
        )
            .then((res) => res.json())
            .then(async (value) => {
                // Resolve all promises in the map for named_rosters
                const formatedRosters = await getFormatedRosters(
                    value,
                    player,
                    getCookie("leagueID")
                );
                console.log(formatedRosters);
                setRosters(formatedRosters);
            });
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case "insights":
                return <Insights userID={player} />;
            case "roster":
                return <Roster rosters={rosters} />;
            case "activity":
                return <Activity userID={player} />;
            case "trade":
                return <Trade userID={player} />;
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
                                {isNaN(parseInt(avgPoints))
                                    ? 0
                                    : parseInt(avgPoints)}
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
