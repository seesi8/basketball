"use client";

import Image from "next/image";
import styles from "../styles/sidebar.module.css";
import { useState, useEffect } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { getCookie, setCookie } from "cookies-next/client";

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

export default function Sidebar() {
  const [leagues, setleagues] = useState(false);
  const [players, setPlayers] = useState(false);
  const [teams, setTeams] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const [rosters, setRosters] = useState([]);

  // Detect screen orientation
  useEffect(() => {
    const handleResize = () => {
      setIsVertical(window.innerWidth < window.innerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetch(
      "/api/rosters?" +
        new URLSearchParams({
          leagueID: getCookie("leagueID"),
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
        setRosters(new_rosters);
      });
  }, []);

  return (
    <>
      <div className={styles.header}>
        {" "}
        {/* Button to toggle sidebar in vertical orientation */}
        {isVertical && (
          <button
            className={styles.toggleButton}
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <RxHamburgerMenu />
          </button>
        )}
        <a className={styles.home} href="/">
          Dynasty-Basketball.com
        </a>
      </div>
      <div style={{ position: "absolute", height: "100%" }}>
        {(showSidebar || !isVertical) && (
          <>
            <div
              className={styles.leagues}
              style={{
                visibility: leagues ? "visible" : "hidden",
                width: leagues ? "12rem" : "0rem",
              }}
              onMouseLeave={(e) => setleagues(false)}
            >
              <div className={styles.container}>
                <a className={styles.item} href="/power">
                  Power Rankings
                </a>
                {/* <a className={styles.item}>Standings</a> */}
                {/* <a className={styles.item}>Playoff Calculator</a> */}
              </div>
            </div>
            <div
              className={styles.players}
              style={{
                visibility: players ? "visible" : "hidden",
                width: players ? "12rem" : "0rem",
              }}
              onMouseLeave={(e) => setPlayers(false)}
            >
              <div className={styles.container}>
                <a className={styles.item} href="/rank">Player Rankings</a>
                <a className={styles.item} href="/calculator">
                  Trade Calculator
                </a>
              </div>
            </div>
            <div
              className={styles.players}
              style={{
                visibility: teams ? "visible" : "hidden",
                width: teams ? "12rem" : "0rem",
              }}
              onMouseLeave={(e) => setTeams(false)}
            >
              <div className={styles.container}>
                {
                  rosters.map((roster) => {
                    return (
                      <a className={styles.item} href={`/players/${roster['owner_id']}`}>
                        <p>{roster["name"]}</p>
                      </a>
                    )
                  })
                }
              </div>
            </div>
            <div className={`${styles.sidebar} ${leagues ? styles.open : ""}`}>
              <div className={styles.container}>
                <a
                  className={styles.item}
                  onMouseEnter={(e) => {
                    setleagues(true);
                    setPlayers(false);
                    setTeams(false);
                  }}
                >
                  leagues
                </a>
                <a
                  className={styles.item}
                  onMouseEnter={(e) => {
                    setPlayers(true);
                    setleagues(false);
                    setTeams(false);

                  }}
                >
                  Players
                </a>
                <a
                  className={styles.item}
                  onMouseEnter={(e) => {
                    setPlayers(false);
                    setleagues(false);
                    setTeams(true);
                  }}
                >
                  Teams
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
