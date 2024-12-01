"use client";

import Image from "next/image";
import styles from "./styles/page.module.css";
import Sidebar from "./components/sidebar";
import { getCookie, setCookie } from "cookies-next/client";
import { useState, useEffect } from "react";

export default function Home() {
  const [leaugeID, setLeaugeID] = useState(getCookie("leaugeID"));
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    setCookie("leaugeID", leaugeID);
  }, [leaugeID]);

  return (
    <main>
      <div className={styles.page}>
        <h3 className={styles.welcome}>Welcome to</h3>
        <h1 className={styles.header}>Dynasty Basketball</h1>
        <p className={styles.paragraph}>
          Dynasty Basketball is an add-free Dynasty Basketball analytics and
          tooling site that utilizes real-time fantasy data for dynasty
          leaguges, aiding users in making quick well-informed fantasy
          basketball decisions.
        </p>
        <div className={styles.sleeper_logo}>
          <div className={styles.sleeper_container}>
            <div className={styles.white}></div>
            <div className={styles.circle}></div>
            <div className={styles.face}></div>
            <data className={styles.eyes}></data>
          </div>
        </div>
        <p className={styles.sleeper}>Sleeper</p>
        <input
          type="text"
          placeholder="Leauge ID"
          className={styles.username}
          value={leaugeID}
          onChange={(e) => setLeaugeID(e.target.value)}
        />
        <div className={styles.container}>
          <button className={styles.button} onClick={(e) => setSignedIn(true)}>
            Sign In
          </button>
        </div>
        <div className={styles.container}>
          <button className={styles.link}>Trade Calculator</button>
          <button className={styles.link}>
            <a href="./power">Power Ranking</a>
          </button>
        </div>
      </div>
    </main>
  );
}
