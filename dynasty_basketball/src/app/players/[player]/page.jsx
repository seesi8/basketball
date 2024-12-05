"use client";

import Image from "next/image";
import styles from "../../styles/player.module.css";
import { useEffect, useState } from "react";
import { use } from "react";
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

async function get_team_name(userID) {
  return fetch(
    "/api/team?" +
      new URLSearchParams({
        userID: userID,
        leaugeID: getCookie("leaugeID")
      }).toString()
  )
    .then((res) => {
      return res.json();
    })
    .then((value) => {
      console.log(value);
      if (value["metadata"]["team_name"]) {
        return value["metadata"]["team_name"];
      } else {
        return `Team ${value["display_name"]}`;
      }
    });
}

export default function Home({ params }) {
  const [name, setName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [record, setRecord] = useState("");
  const { player } = use(params);

  useEffect(() => {
    get_name(player).then((value) => {
      setName(value);
    });

    get_team_name(player).then((value) => {
      console.log
      setTeamName(value);
    });

    get_record(player).then((value) => {
      setRecord( `${value["wins"]}-${value["losses"]}${(value["ties"] > 0) ? `-${value["ties"]}` : ""}`)
    })
  }, []);

  return (
    <div className={styles.page}>
      <h3 className={styles.back}>
        <a className={styles.power} href="/power">
          Power Rankings
        </a>
        {" >"} {name}
      </h3>
      <div className={styles.topRow}>
        <h2>Team "{teamName}"</h2>
        <p>Managed by {name}</p>
        <h1>{record}</h1>
      </div>
    </div>
  );
}
