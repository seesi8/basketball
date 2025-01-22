"use client";

import Image from "next/image";
import styles from "../styles/rank.module.css";
import { useEffect, useState } from "react";

export default function Home() {
    const [rankings, setRankings] = useState([]);
    const [current, setCurrent] = useState("");
    const [rookies, setRookies] = useState(false);

    useEffect(() => {
        return fetch("/api/all_players")
            .then((res) => {
                return res.json();
            })
            .then((value) => {
                setRankings(value);
            });
    }, []);

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>Fantasy Basketball Player Rankings</h1>
            <div className={styles.searchbar}>
                <input
                    type="text"
                    className={styles.search}
                    placeholder="Search"
                    value={current}
                    onChange={(e) => {
                        setCurrent(e.target.value);
                    }}
                />
                <label className={styles.label}>
                    Rookies Only:
                    <input
                        type="checkbox"
                        className={styles.check}
                        onChange={(e) => {
                            setRookies(!rookies);
                        }}
                    />
                </label>
            </div>
            <table className={styles.table}>
                <thead className={styles.outerHead}>
                    <tr className={styles.head}>
                        <th className={styles.rankHead}>Rank</th>
                        <th className={styles.rankName}>Name</th>
                        <th className={styles.rankTeam}>Team</th>
                        <th className={styles.rankPos}>Positions</th>
                        <th className={styles.rankAge}>Age</th>
                        <th className={styles.rankValue}>Value</th>
                    </tr>
                </thead>
                <tbody>
                    {rankings.map((player, index) => {
                        if (
                            !player["Name"]
                                .toLowerCase()
                                .includes(current.toLowerCase())
                        ) {
                            return <></>;
                        }
                        
                        console.log(rookies, (player["experience"]))
                        if(rookies && (parseFloat(player["experience"]) != 0)){
                          return <></>
                        }

                        return (
                            <>
                                <tr className={styles.player}>
                                    <td className={styles.rank}>{index + 1}</td>
                                    <td className={styles.name}>
                                        {player["Name"]}
                                    </td>
                                    <td className={styles.team}>
                                        {player["Team"]}
                                    </td>
                                    <td className={styles.position}>
                                        {player["Positions"]}
                                    </td>
                                    <td className={styles.age}>
                                        {player["Age"]}
                                    </td>
                                    <td className={styles.value}>
                                        {parseInt(player["Value"])}
                                    </td>
                                </tr>
                            </>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
