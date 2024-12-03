"use state";
import Image from "next/image";
import styles from "../styles/sidebar.module.css";
import { useState, useEffect } from "react";
import { RxHamburgerMenu } from "react-icons/rx";

export default function Sidebar() {
  const [leauges, setLeauges] = useState(false);
  const [players, setPlayers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isVertical, setIsVertical] = useState(false);

  // Detect screen orientation
  useEffect(() => {
    const handleResize = () => {
      setIsVertical(window.innerWidth < window.innerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
          <div className={`${styles.sidebar} ${leauges ? styles.open : ""}`}>
            <div className={styles.container}>
              <a
                className={styles.item}
                onMouseEnter={(e) => {
                  setLeauges(true);
                  setPlayers(false);
                }}
              >
                Leauges
              </a>
              <a
                className={styles.item}
                onMouseEnter={(e) => {
                  setPlayers(true);
                  setLeauges(false);
                }}
              >
                Players
              </a>
              {/* <a className={styles.item}>Teams</a> */}
            </div>
          </div>
        )}
        <div
          className={styles.leauges}
          style={{
            visibility: leauges ? "visible" : "hidden",
            width: leauges ? "12rem" : "0rem",
          }}
          onMouseLeave={(e) => setLeauges(false)}
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
            {/* <a className={styles.item}>Player Rankings</a> */}
            <a className={styles.item} href="/calculator">
              Trade Calculator
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
