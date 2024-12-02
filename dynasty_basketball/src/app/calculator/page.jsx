"use client";

import Image from "next/image";
import styles from "../styles/calculator.module.css";
import { useEffect, useState } from "react";
import { getCookie, setCookie } from "cookies-next/client";

async function get_name(userID) {
  return fetch(
    "./api/user?" +
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

function loosing_roster(roster, roster2, roster3, roster4) {
  if (
    sumArray(roster.map((player) => parseInt(player.value))) <
    sumArray(roster2.map((player) => parseInt(player.value)))
  ) {
    return roster3;
  } else {
    return roster4;
  }
}

function roster_difforence(roster, roster2) {
  return Math.abs(
    sumArray(roster.map((player) => parseInt(player.value))) -
      sumArray(roster2.map((player) => parseInt(player.value)))
  );
}

function areWithinTenPercent(num1, num2) {
  // Calculate the difference
  const difference = Math.abs(num1 - num2);

  // Calculate 10% of the larger number
  const tenPercent = Math.max(num1, num2) * 0.1;

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

async function get_player(playerID) {
  return fetch(
    "./api/value?" +
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

async function get_picks(userID) {
  const response = await fetch(
    "./api/picks?" +
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
  const [team1Selected, setTeam1Selected] = useState([]);
  const [team2Selected, setTeam2Selected] = useState([]);

  useEffect(() => {
    setTheLoosingRoster(
      loosing_roster(
        team1Selected,
        team2Selected,
        team1Players,
        team2Players
      ).filter((player) => {
        return (
          player["value"] <
          roster_difforence(team1Selected, team2Selected) * 1.1 && !(loosing_roster(
            team1Selected,
            team2Selected,
            team1Selected,
            team2Selected
          ).includes(player))
        );
      })
    );
  }, [team1Selected, team2Selected]);

  useEffect(() => {
    fetch(
      "./api/rosters?" +
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
    const fetchTeam1Players = async () => {
      for (let roster_id in rosters) {
        let roster = rosters[roster_id];
        if (roster["owner_id"] === team1) {
          const players = await Promise.all(
            roster["players"].map(async (player_id) => {
              let data = await get_player(player_id);
              return {
                name: data["Name"],
                value: data["Value"],
                team: data["Team"],
                age: data["Age"],
                positions: data["Positions"],
                id: player_id,
              };
            })
          );
          let picks = await Promise.all(
            (
              await get_picks(team1)
            ).map(async (player_id) => {
              let data = await get_player(player_id);
              return {
                name: data["Name"],
                value: data["Value"],
                team: data["Team"],
                age: data["Age"],
                positions: data["Positions"],
                id: player_id,
              };
            })
          );
          setTeam1Players(
            [...picks, ...players].sort((a, b) => b.value - a.value)
          );
        }
      }
    };

    fetchTeam1Players(); // Call the async function
  }, [team1, rosters]);

  useEffect(() => {
    get_name(team2).then((data) => {
      setTeam2Name(data);
    });

    setTeam2Selected([]);

    const fetchTeam2Players = async () => {
      for (let roster_id in rosters) {
        let roster = rosters[roster_id];
        if (roster["owner_id"] === team2) {
          const players = await Promise.all(
            roster["players"].map(async (player_id) => {
              let data = await get_player(player_id);
              return {
                name: data["Name"],
                value: data["Value"],
                team: data["Team"],
                age: data["Age"],
                positions: data["Positions"],
                id: player_id,
              };
            })
          );
          let picks = await Promise.all(
            (
              await get_picks(team2)
            ).map(async (player_id) => {
              let data = await get_player(player_id);
              return {
                name: data["Name"],
                value: data["Value"],
                team: data["Team"],
                age: data["Age"],
                positions: data["Positions"],
                id: player_id,
              };
            })
          );
          setTeam2Players(
            [...picks, ...players].sort((a, b) => b.value - a.value)
          );
        }
      }
    };

    fetchTeam2Players(); // Call the async function
  }, [team2, rosters]);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Fantasy Football Trade Calculator</h1>
      <p>
        Build fantasy dynasty trades with our trade calculator. Log into your
        league and the fantasy trade analyzer will update based on your league's
        rosters.
      </p>
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
                  <option value={roster["owner_id"]}>{roster["name"]}</option>
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
                  if (
                    player["name"]
                      .toLowerCase()
                      .includes(currentTeam1Input.toLowerCase()) &&
                    !team1Selected
                      .map((player) => player["id"])
                      .includes(player["id"])
                  ) {
                    return (
                      <div
                        className={styles.playerContainer}
                        onMouseDown={(e) => {
                          setTeam1Selected([...team1Selected, player]);
                        }}
                      >
                        <p className={styles.playerName}>{player["name"]}</p>
                        <p className={styles.right}>
                          {parseInt(player["value"])}
                        </p>
                        <p className={styles.position}>
                          {player["positions"]} {team2Name}
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
                    const newSelected = team1Selected.filter(
                      (newPlayer) => newPlayer["id"] !== player["id"]
                    );
                    setTeam1Selected(newSelected);
                  }}
                >
                  X
                </button>
              </div>
            );
          })}
          <div
            className={styles.totalContainer}
            style={{
              color: areWithinTenPercent(
                sumArray(team1Selected.map((player) => parseInt(player.value))),
                sumArray(team2Selected.map((player) => parseInt(player.value)))
              )
                ? "white"
                : "#CC7D82",
            }}
          >
            <p className={styles.selected}>{team1Selected.length} pieces </p>
            <p className={styles.sum}>
              {sumArray(team1Selected.map((player) => parseInt(player.value)))}
            </p>
          </div>
          <h2>
            {team1Name}:{" "}
            {sumArray(team1Selected.map((player) => parseInt(player.value)))}
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
                  <option value={roster["owner_id"]}>{roster["name"]}</option>
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
                  if (
                    player["name"]
                      .toLowerCase()
                      .includes(currentTeam2Input.toLowerCase()) &&
                    !team2Selected
                      .map((player) => player["id"])
                      .includes(player["id"])
                  ) {
                    return (
                      <div
                        className={styles.playerContainer}
                        onMouseDown={(e) => {
                          setTeam2Selected([...team2Selected, player]);
                        }}
                      >
                        <p className={styles.playerName}>{player["name"]}</p>
                        <p className={styles.right}>
                          {parseInt(player["value"])}
                        </p>
                        <p className={styles.position}>
                          {player["positions"]} {team2Name}
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
                    const newSelected = team2Selected.filter(
                      (newPlayer) => newPlayer["id"] !== player["id"]
                    );
                    setTeam2Selected(newSelected);
                  }}
                >
                  X
                </button>
              </div>
            );
          })}
          <div
            className={styles.totalContainer}
            style={{
              color: areWithinTenPercent(
                sumArray(team1Selected.map((player) => parseInt(player.value))),
                sumArray(team2Selected.map((player) => parseInt(player.value)))
              )
                ? "white"
                : "#CC7D82",
            }}
          >
            <p className={styles.selected}>{team2Selected.length} pieces </p>
            <p className={styles.sum}>
              {sumArray(team2Selected.map((player) => parseInt(player.value)))}
            </p>
          </div>
          <h2>
            {team2Name}:{" "}
            {sumArray(team2Selected.map((player) => parseInt(player.value)))}
          </h2>
        </div>
      </div>
      <div
        className={styles.favors}
        style={{
          backgroundColor: areWithinTenPercent(
            sumArray(team1Selected.map((player) => parseInt(player.value))),
            sumArray(team2Selected.map((player) => parseInt(player.value)))
          )
            ? "#484863"
            : "#CC7D82",
        }}
      >
        <h2 className={styles.trade}>
          {areWithinTenPercent(
            sumArray(team1Selected.map((player) => parseInt(player.value))),
            sumArray(team2Selected.map((player) => parseInt(player.value)))
          )
            ? "Fair Trade"
            : `Favors: ${
                sumArray(
                  team1Selected.map((player) => parseInt(player.value))
                ) >
                sumArray(team2Selected.map((player) => parseInt(player.value)))
                  ? team2Name
                  : team1Name
              }`}
        </h2>
        {areWithinTenPercent(
          sumArray(team1Selected.map((player) => parseInt(player.value))),
          sumArray(team2Selected.map((player) => parseInt(player.value)))
        ) ? (
          ""
        ) : (
          <p className={styles.add}>
            Add a player with{" "}
            <span className={styles.bold}>
              {Math.abs(
                sumArray(
                  team1Selected.map((player) => parseInt(player.value))
                ) -
                  sumArray(
                    team2Selected.map((player) => parseInt(player.value))
                  )
              )}
            </span>{" "}
            value to even trade
          </p>
        )}
      </div>
      <div className={styles.tiles}>
        <div className={styles.playersAdd}>
          <h3 className={styles.toAddTitle}>
            Players to even the trade from{" "}
            {sumArray(team1Selected.map((player) => parseInt(player.value))) >
            sumArray(team2Selected.map((player) => parseInt(player.value)))
              ? team2Name
              : team1Name}
          </h3>
          {theLoosingRoster.slice(0, 5).map((player, index) => {
            return (
              <div
                className={styles.playerToEven}
                key={player["name"]}
                onMouseDown={(e) => {
                  if (
                    sumArray(
                      team1Selected.map((player) => parseInt(player.value))
                    ) >
                    sumArray(
                      team2Selected.map((player) => parseInt(player.value))
                    )
                  ) {
                    setTeam2Selected([...team2Selected, player]);
                } else {
                    setTeam1Selected([...team1Selected, player]);
                  }
                }}
              >
                <p>{player["name"]}</p>
                <p>{parseInt(player["value"])}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
