"use client";

import Image from "next/image";
import styles from "../styles/power.module.css";
import { useEffect, useState } from "react";
import { getCookie, setCookie } from "cookies-next/client";
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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

const getColor = (rank) => {
  if (rank <= 3) {
    return "#30B390"; // Gold for top 5 ranks
  } else if (rank <= 8) {
    return "#B0CFFE"; // Bronze for ranks 11-20
  } else {
    return "#D28A50"; // Default (white) for others
  }
};

function filterByPosition(list, position) {
  return list
    .filter((item) => {
      console.log(item);
      if (item["Positions"]) {
        return item["Positions"].substring(0, position.length) == position;
      } else {
        return false;
      }
    })
    .sort((a, b) => b["Value"] - a["Value"]); // Sort by item["Value"]
}

const getBackgroundColor = (rank) => {
  if (rank <= 3) {
    return "#5E711E"; // Gold for top 5 ranks
  } else if (rank <= 6) {
    return "#705B1E"; // Silver for ranks 6-10
  } else if (rank <= 8) {
    return "#8A3E35"; // Bronze for ranks 11-20
  } else {
    return "#680B27"; // Default (white) for others
  }
};

function averageNonZeroValues(arr) {
  const nonZeroValues = arr.filter((value) => value !== 0); // Filter out zero values
  const sum = nonZeroValues.reduce((sum, value) => sum + value, 0); // Sum the non-zero values
  return nonZeroValues.length > 0 ? sum / nonZeroValues.length : 0; // Calculate average
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

export default function Home() {
  const [name, setName] = useState("Leauge");
  const [rosters, setRosters] = useState([]);
  const [currentView, setCurrentView] = useState("");

  // Set Name
  useEffect(() => {
    fetch(
      "/api/sleeper?" +
        new URLSearchParams({
          leaugeID: getCookie("leaugeID"),
        }).toString()
    )
      .then((res) => {
        return res.json();
      })
      .then((value) => {
        setName(value["name"]);
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
            item["pgs"] = filterByPosition(item["player_details"], "PG");
            item["sgs"] = filterByPosition(item["player_details"], "SG");
            item["sfs"] = filterByPosition(item["player_details"], "SF");
            item["pfs"] = filterByPosition(item["player_details"], "PF");
            item["cs"] = filterByPosition(item["player_details"], "C");

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
                if (player_value["Positions"].substring(0, 2) == "PG") {
                  return parseInt(player_value["Value"]);
                } else {
                  return 0;
                }
              })
            );
            item["pg_value"] = item["pg_values"].reduce((a, b) => a + b, 0);

            item["pg_ages"] = await Promise.all(
              item["player_details"].map(async (player_value) => {
                if (player_value["Positions"] == undefined) {
                  return 0;
                }
                if (player_value["Positions"].substring(0, 2) == "PG") {
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
                if (player_value["Positions"].substring(0, 2) == "SG") {
                  return parseInt(player_value["Value"]);
                } else {
                  return 0;
                }
              })
            );
            item["sg_value"] = item["sg_values"].reduce((a, b) => a + b, 0);

            item["sg_ages"] = await Promise.all(
              item["player_details"].map(async (player_value) => {
                if (player_value["Positions"] == undefined) {
                  return 0;
                }
                if (player_value["Positions"].substring(0, 2) == "SG") {
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
                if (player_value["Positions"].substring(0, 2) == "SF") {
                  return parseInt(player_value["Value"]);
                } else {
                  return 0;
                }
              })
            );
            item["sf_value"] = item["sf_values"].reduce((a, b) => a + b, 0);

            item["sf_ages"] = await Promise.all(
              item["player_details"].map(async (player_value) => {
                if (player_value["Positions"] == undefined) {
                  return 0;
                }
                if (player_value["Positions"].substring(0, 2) == "SF") {
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
                if (player_value["Positions"].substring(0, 2) == "PF") {
                  return parseInt(player_value["Value"]);
                } else {
                  return 0;
                }
              })
            );
            item["pf_value"] = item["pf_values"].reduce((a, b) => a + b, 0);

            item["pf_ages"] = await Promise.all(
              item["player_details"].map(async (player_value) => {
                if (player_value["Positions"] == undefined) {
                  return 0;
                }
                if (player_value["Positions"].substring(0, 2) == "PF") {
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
                if (player_value["Positions"].substring(0, 1) == "C") {
                  return parseInt(player_value["Value"]);
                } else {
                  return 0;
                }
              })
            );
            item["c_value"] = item["c_values"].reduce((a, b) => a + b, 0);

            item["c_ages"] = await Promise.all(
              item["player_details"].map(async (player_value) => {
                if (player_value["Positions"] == undefined) {
                  return 0;
                }
                if (player_value["Positions"].substring(0, 1) == "C") {
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
            item["picks_value"] = picks_values.reduce((a, b) => a + b, 0);

            item["player_values"] = item["player_values"].map((value) =>
              isNaN(value) ? 0 : value
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

        named_rosters.sort((a, b) => b["total_value"] - a["total_value"]);

        named_rosters = addRankings(named_rosters);

        console.log(named_rosters);

        setRosters(named_rosters);
      });
  }, []);

  return (
    <div className={styles.main}>
      <h1 className={styles.dynasty}>Dynasty-Basketball.com</h1>
      <h1 className={styles.title}>{name} Power Rankings</h1>
      <p className={styles.des}>
        Our fantasy team ranker uses fantasy trade values and ADP to give you a
        complete fantasy football power rankings view.
      </p>
      <div className={styles.graph}>
        <div className={styles.key_container}>
          <div className={styles.key}>
            <div className={styles.key_item}>
              <div className={styles.kp}></div>
              <div className={styles.legend}>Picks</div>
            </div>
            <div className={styles.key_item}>
              <div className={styles.kpg}></div>
              <div className={styles.legend}>Point Guards</div>
            </div>
            <div className={styles.key_item}>
              <div className={styles.ksg}></div>
              <div className={styles.legend}>Shooting Guards</div>
            </div>
            <div className={styles.key_item}>
              <div className={styles.ksf}></div>
              <div className={styles.legend}>Small Forwards</div>
            </div>
            <div className={styles.key_item}>
              <div className={styles.kpf}></div>
              <div className={styles.legend}>Power Forwards</div>
            </div>
            <div className={styles.key_item}>
              <div className={styles.kc}></div>
              <div className={styles.legend}>Centers</div>
            </div>
          </div>
        </div>
        <div className={styles.bars}>
          {rosters.map((roster) => {
            return (
              <div key={roster["owner_id"]} className={styles.chart_item}>
                <div
                  className={styles.p}
                  style={{ height: `${roster["picks_value"] / 2000}vh` }}
                ></div>
                <div
                  className={styles.pg}
                  style={{ height: `${roster["pg_value"] / 2000}vh` }}
                ></div>
                <div
                  className={styles.sg}
                  style={{ height: `${roster["sg_value"] / 2000}vh` }}
                ></div>
                <div
                  className={styles.sf}
                  style={{ height: `${roster["sf_value"] / 2000}vh` }}
                ></div>
                <div
                  className={styles.pf}
                  style={{ height: `${roster["pf_value"] / 2000}vh` }}
                ></div>
                <div
                  className={styles.c}
                  style={{ height: `${roster["c_value"] / 2000}vh` }}
                ></div>
                <p className={styles.name}>{roster["name"]}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th>Team</th>
              <th>Record</th>
              <th>Overall Rank</th>
              <th>Starter Rank</th>
              <th>PG Rank</th>
              <th>SG Rank</th>
              <th>SF Rank</th>
              <th>PF Rank</th>
              <th>C Rank</th>
              <th>Draft Rank</th>
            </tr>
          </thead>
          <tbody>
            {rosters.map((roster) => {
              return (
                <>
                  <tr
                    key={roster["owner_id"]}
                    className={styles.tableRow}
                    onClick={(e) => {
                      setCurrentView(roster["owner_id"]);
                    }}
                  >
                    <td>{roster["name"]}</td>
                    <td>{`${roster["record"]["wins"]}-${
                      roster["record"]["losses"]
                    }${
                      roster["record"]["ties"] > 0
                        ? `-${roster["record"]["ties"]}`
                        : ""
                    }`}</td>
                    <td className={styles.cell}>
                      <div className={styles.rankContainer}>
                        <div
                          className={styles.rank}
                          style={{
                            backgroundColor: getBackgroundColor(
                              roster["total_value_rank"]
                            ),
                          }}
                        >
                          {roster["total_value_rank"]}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cell}>
                      <div className={styles.rankContainer}>
                        <div
                          className={styles.rank}
                          style={{
                            backgroundColor: getBackgroundColor(
                              roster["starter_value_rank"]
                            ),
                          }}
                        >
                          {roster["starter_value_rank"]}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cell}>
                      <div className={styles.rankContainer}>
                        <div
                          className={styles.rank}
                          style={{
                            backgroundColor: getBackgroundColor(
                              roster["pg_value_rank"]
                            ),
                          }}
                        >
                          {roster["pg_value_rank"]}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cell}>
                      <div className={styles.rankContainer}>
                        <div
                          className={styles.rank}
                          style={{
                            backgroundColor: getBackgroundColor(
                              roster["sg_value_rank"]
                            ),
                          }}
                        >
                          {roster["sg_value_rank"]}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cell}>
                      <div className={styles.rankContainer}>
                        <div
                          className={styles.rank}
                          style={{
                            backgroundColor: getBackgroundColor(
                              roster["sf_value_rank"]
                            ),
                          }}
                        >
                          {roster["sf_value_rank"]}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cell}>
                      <div className={styles.rankContainer}>
                        <div
                          className={styles.rank}
                          style={{
                            backgroundColor: getBackgroundColor(
                              roster["pf_value_rank"]
                            ),
                          }}
                        >
                          {roster["pf_value_rank"]}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cell}>
                      <div className={styles.rankContainer}>
                        <div
                          className={styles.rank}
                          style={{
                            backgroundColor: getBackgroundColor(
                              roster["c_value_rank"]
                            ),
                          }}
                        >
                          {roster["c_value_rank"]}
                        </div>
                      </div>
                    </td>
                    <td className={styles.cell}>
                      <div className={styles.rankContainer}>
                        <div
                          className={styles.rank}
                          style={{
                            backgroundColor: getBackgroundColor(
                              roster["picks_value_rank"]
                            ),
                          }}
                        >
                          {roster["picks_value_rank"]}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr
                    key={roster["owner_id"] + "detailed"}
                    className={styles.detail}
                    style={{
                        visibility:
                          currentView == roster["owner_id"]
                            ? "visible"
                            : "hidden",
                        height:
                          currentView == roster["owner_id"]
                            ? `${
                                3.25 + Math.max(
                                  roster["pgs"].length, 
                                  roster["sgs"].length, 
                                  roster["sfs"].length, 
                                  roster["pfs"].length, 
                                  roster["cs"].length, 
                                  roster["picks_details"].length
                                ) * 1 < 10
                                  ? 10
                                  : 3.25 + Math.max(
                                      roster["pgs"].length, 
                                      roster["sgs"].length, 
                                      roster["sfs"].length, 
                                      roster["pfs"].length, 
                                      roster["cs"].length, 
                                      roster["picks_details"].length
                                    ) * 1
                              }rem`
                            : "0rem",
                      }}
                      
                  >
                    <div className={styles.detailContainer}>
                      <td
                        className={styles.detailed}
                        style={{
                          visibility:
                            currentView == roster["owner_id"]
                              ? "visible"
                              : "hidden",
                          height:
                            currentView == roster["owner_id"] ? "" : "0rem",
                          padding:
                            currentView == roster["owner_id"] ? "" : "0rem",
                        }}
                      >
                        <div className={styles.detailedContainer}>
                          <p className={styles.detailedRank}>Overall Rank</p>
                          <p
                            className={styles.detailedRankValue}
                            style={{
                              color: getColor(roster["total_value_rank"]),
                            }}
                          >
                            {roster["total_value_rank"]}{" "}
                            <span className={styles.value}>
                              (Value:{" "}
                              <span className={styles.valueNumber}>
                                {roster["total_value"]}
                              </span>
                              )
                            </span>
                          </p>
                          <p className={styles.detailedRank}>Starter Rank</p>
                          <p
                            className={styles.detailedRankValue}
                            style={{
                              color: getColor(roster["starter_value_rank"]),
                            }}
                          >
                            {roster["starter_value_rank"]}{" "}
                            <span className={styles.value}>
                              (Value:{" "}
                              <span className={styles.valueNumber}>
                                {roster["starter_value"]}
                              </span>
                              )
                            </span>
                          </p>
                          <p className={styles.detailedRank}>Avg Age</p>
                          <p className={styles.detailedRankValue}>
                            {roster["avg_age"].toFixed(2)}
                          </p>
                          <p className={styles.detailedRank}>Record</p>
                          <p className={styles.detailedRankValue}>
                            {`${roster["record"]["wins"]}-${
                              roster["record"]["losses"]
                            }${
                              roster["record"]["ties"] > 0
                                ? `-${roster["record"]["ties"]}`
                                : ""
                            }`}
                          </p>
                        </div>
                      </td>
                      <td className={styles.detailed}>
                        <p className={styles.detailedRankPosition}>
                          PG Rank:{" "}
                          <span
                            className={styles.detailedRankValue}
                            style={{
                              color: getColor(roster["pg_value_rank"]),
                            }}
                          >
                            {roster["pg_value_rank"]}{" "}
                          </span>
                        </p>
                        <p>
                          <span className={styles.value}>
                            Value:{" "}
                            <span className={styles.valueNumber}>
                              {roster["pg_value"]}{" "}
                            </span>
                            | Age:{" "}
                            <span className={styles.valueNumber}>
                              {roster["pg_age"].toFixed(2)}{" "}
                            </span>
                          </span>
                        </p>
                        <hr className={styles.break} />
                        {roster["pgs"].map((player) => {
                          return (
                            <div className={styles.playerNameContainer}>
                              <p className={styles.playerName}>
                                {player["Name"]}
                              </p>
                              <p className={styles.playerValue}>
                                {parseInt(player["Value"])}
                              </p>
                            </div>
                          );
                        })}
                      </td>
                      <td className={styles.detailed}>
                        <p className={styles.detailedRankPosition}>
                          SG Rank:{" "}
                          <span
                            className={styles.detailedRankValue}
                            style={{
                              color: getColor(roster["sg_value_rank"]),
                            }}
                          >
                            {roster["sg_value_rank"]}{" "}
                          </span>
                        </p>
                        <p>
                          <span className={styles.value}>
                            Value:{" "}
                            <span className={styles.valueNumber}>
                              {roster["sg_value"]}{" "}
                            </span>
                            | Age:{" "}
                            <span className={styles.valueNumber}>
                              {roster["sg_age"].toFixed(2)}{" "}
                            </span>
                          </span>
                        </p>
                        <hr className={styles.break} />
                        {roster["sgs"].map((player) => {
                          return (
                            <div className={styles.playerNameContainer}>
                              <p className={styles.playerName}>
                                {player["Name"]}
                              </p>
                              <p className={styles.playerValue}>
                                {parseInt(player["Value"])}
                              </p>
                            </div>
                          );
                        })}
                      </td>
                      <td className={styles.detailed}>
                        <p className={styles.detailedRankPosition}>
                          SF Rank:{" "}
                          <span
                            className={styles.detailedRankValue}
                            style={{
                              color: getColor(roster["sf_value_rank"]),
                            }}
                          >
                            {roster["sf_value_rank"]}{" "}
                          </span>
                        </p>
                        <p>
                          <span className={styles.value}>
                            Value:{" "}
                            <span className={styles.valueNumber}>
                              {roster["sf_value"]}{" "}
                            </span>
                            | Age:{" "}
                            <span className={styles.valueNumber}>
                              {roster["sf_age"].toFixed(2)}{" "}
                            </span>
                          </span>
                        </p>
                        <hr className={styles.break} />
                        {roster["sfs"].map((player) => {
                          return (
                            <div
                              key={player["Name"]}
                              className={styles.playerNameContainer}
                            >
                              <p className={styles.playerName}>
                                {player["Name"]}
                              </p>
                              <p className={styles.playerValue}>
                                {parseInt(player["Value"])}
                              </p>
                            </div>
                          );
                        })}
                      </td>
                      <td className={styles.detailed}>
                        <p className={styles.detailedRankPosition}>
                          PF Rank:{" "}
                          <span
                            className={styles.detailedRankValue}
                            style={{
                              color: getColor(roster["pf_value_rank"]),
                            }}
                          >
                            {roster["pf_value_rank"]}{" "}
                          </span>
                        </p>
                        <p>
                          <span className={styles.value}>
                            Value:{" "}
                            <span className={styles.valueNumber}>
                              {roster["pf_value"]}{" "}
                            </span>
                            | Age:{" "}
                            <span className={styles.valueNumber}>
                              {roster["pf_age"].toFixed(2)}{" "}
                            </span>
                          </span>
                        </p>
                        <hr className={styles.break} />
                        {roster["pfs"].map((player) => {
                          return (
                            <div
                              key={player["Name"]}
                              className={styles.playerNameContainer}
                            >
                              <p className={styles.playerName}>
                                {player["Name"]}
                              </p>
                              <p className={styles.playerValue}>
                                {parseInt(player["Value"])}
                              </p>
                            </div>
                          );
                        })}
                      </td>
                      <td className={styles.detailed}>
                        <p className={styles.detailedRankPosition}>
                          C Rank:{" "}
                          <span
                            className={styles.detailedRankValue}
                            style={{
                              color: getColor(roster["c_value_rank"]),
                            }}
                          >
                            {roster["c_value_rank"]}{" "}
                          </span>
                        </p>
                        <p>
                          <span className={styles.value}>
                            Value:{" "}
                            <span className={styles.valueNumber}>
                              {roster["c_value"]}{" "}
                            </span>
                            | Age:{" "}
                            <span className={styles.valueNumber}>
                              {roster["c_age"].toFixed(2)}{" "}
                            </span>
                          </span>
                        </p>
                        <hr className={styles.break} />
                        {roster["cs"].map((player) => {
                          return (
                            <div
                              key={player["Name"]}
                              className={styles.playerNameContainer}
                            >
                              <p className={styles.playerName}>
                                {player["Name"]}
                              </p>
                              <p className={styles.playerValue}>
                                {parseInt(player["Value"])}
                              </p>
                            </div>
                          );
                        })}
                      </td>
                      <td className={styles.detailed}>
                        <p className={styles.detailedRankPosition}>
                          Draft Rank:{" "}
                          <span
                            className={styles.detailedRankValue}
                            style={{
                              color: getColor(roster["picks_value_rank"]),
                            }}
                          >
                            {roster["picks_value_rank"]}{" "}
                          </span>
                        </p>
                        <p>
                          <span className={styles.value}>
                            Value:{" "}
                            <span className={styles.valueNumber}>
                              {roster["picks_value"]}{" "}
                            </span>
                          </span>
                        </p>
                        <hr className={styles.break} />
                        {roster["picks_details"].map((player) => {
                          return (
                            <div
                              key={uuid()}
                              className={styles.playerNameContainer}
                            >
                              <p className={styles.playerName}>
                                {player["Name"]}
                              </p>
                              <p className={styles.playerValue}>
                                {parseInt(player["Value"])}
                              </p>
                            </div>
                          );
                        })}
                      </td>
                    </div>
                  </tr>
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
