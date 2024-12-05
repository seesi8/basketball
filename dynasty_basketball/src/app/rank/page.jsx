"use client";

import Image from "next/image";
import styles from "../styles/rank.module.css";
import { useEffect, useState } from "react";

export default function Home() {
  const [rankings, setRankings] = useState([]);

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
            return (
              <>
                <tr className={styles.player}>
                  <td className={styles.rank}>{index}</td>
                  <td className={styles.name}>{player["Name"]}</td>
                  <td className={styles.team}>{player["Team"]}</td>
                  <td className={styles.position}>{player["Positions"]}</td>
                  <td className={styles.age}>{player["Age"]}</td>
                  <td className={styles.value}>{parseInt(player["Value"])}</td>
                </tr>
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
