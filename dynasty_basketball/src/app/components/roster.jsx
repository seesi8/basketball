import Image from "next/image";
import styles from "../styles/roster.module.css";
import { Radar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from "chart.js";

export default function Roster({ rosters }) {
    if (rosters == undefined) {
        return <p>loading</p>;
    }

    ChartJS.register(
        RadialLinearScale,
        PointElement,
        LineElement,
        Filler,
        Tooltip,
        Legend
    );

    // Data for the chart
    const data = {
        labels: ["PG", "SG", "SF", "SF", "C", "Picks"],
        datasets: [
            {
                label: "Rankings",
                data: [
                    11 - rosters["pg_value_rank"],
                    11 - rosters["sg_value_rank"],
                    11 - rosters["sf_value_rank"],
                    11 - rosters["pf_value_rank"],
                    11 - rosters["c_value_rank"],
                    11 - rosters["picks_value_rank"],
                ], // Replace with your actual data
                backgroundColor: "rgba(0, 204, 255, 0.4)", // Adjust the opacity and color
                borderColor: "rgba(0, 204, 255, 1)", // Line color
                borderWidth: 2,
            },
        ],
    };

    // Options for the chart
    const options = {
        plugins: {
            legend: {
                display: false, // Hides the legend
            },
            tooltip: {
                enabled: true,
            },
            chartAreaBackground: {
                color: "lightblue", // Background color for the entire chart area
            },
        },
        scales: {
            r: {
                angleLines: {
                    display: true,
                },
                suggestedMin: 0,
                suggestedMax: 10, // Adjust depending on your data range
                grid: {
                    color: "#2e2e2e", // Grid line color
                },
                pointLabels: {
                    color: "#ffffff", // Axis label color
                },
                ticks: {
                    display: false, // Hides the scale numbers
                },
            },
        },
    };

    return (
        <div className={styles.insights}>
            <h3 className={styles.title}>Roster Trends</h3>
            <div className={styles.positions}>
                <div className={styles.position}>
                    <p className={styles.tileTitle}>Overall</p>
                    <p className={styles.value}>
                        Value{" "}
                        <span className={styles.bold}>
                            {rosters["total_value"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Rank{" "}
                        <span className={styles.bold}>
                            {rosters["total_value_rank"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Avg. Age{" "}
                        <span className={styles.bold}>
                            {parseInt(rosters["avg_age"])}
                        </span>
                    </p>
                </div>
                <div className={styles.position}>
                    <p className={styles.tileTitle}>PG Room</p>
                    <p className={styles.value}>
                        Value{" "}
                        <span className={styles.bold}>
                            {rosters["pg_value"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Rank{" "}
                        <span className={styles.bold}>
                            {rosters["pg_value_rank"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Avg. Age{" "}
                        <span className={styles.bold}>
                            {parseInt(rosters["pg_age"])}
                        </span>
                    </p>
                </div>
                <div className={styles.position}>
                    <p className={styles.tileTitle}>SG Room</p>
                    <p className={styles.value}>
                        Value{" "}
                        <span className={styles.bold}>
                            {rosters["sg_value"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Rank{" "}
                        <span className={styles.bold}>
                            {rosters["sg_value_rank"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Avg. Age{" "}
                        <span className={styles.bold}>
                            {parseInt(rosters["sg_age"])}
                        </span>
                    </p>
                </div>
                <div className={styles.position}>
                    <p className={styles.tileTitle}>SF Room</p>
                    <p className={styles.value}>
                        Value{" "}
                        <span className={styles.bold}>
                            {rosters["sf_value"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Rank{" "}
                        <span className={styles.bold}>
                            {rosters["sf_value_rank"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Avg. Age{" "}
                        <span className={styles.bold}>
                            {parseInt(rosters["sf_age"])}
                        </span>
                    </p>
                </div>
                <div className={styles.position}>
                    <p className={styles.tileTitle}>PF Room</p>
                    <p className={styles.value}>
                        Value{" "}
                        <span className={styles.bold}>
                            {rosters["pf_value"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Rank{" "}
                        <span className={styles.bold}>
                            {rosters["pf_value_rank"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Avg. Age{" "}
                        <span className={styles.bold}>
                            {parseInt(rosters["pf_age"])}
                        </span>
                    </p>
                </div>
                <div className={styles.position}>
                    <p className={styles.tileTitle}>C Room</p>
                    <p className={styles.value}>
                        Value{" "}
                        <span className={styles.bold}>
                            {rosters["c_value"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Rank{" "}
                        <span className={styles.bold}>
                            {rosters["c_value_rank"]}
                        </span>
                    </p>
                    <p className={styles.value}>
                        Avg. Age{" "}
                        <span className={styles.bold}>
                            {parseInt(rosters["c_age"])}
                        </span>
                    </p>
                </div>
            </div>
            <div className={styles.chartContainer}>
                <div className={styles.chart}>
                    <h2 style={{ textAlign: "center", color: "#fff" }}>
                        Position Rankings
                    </h2>
                    <Radar data={data} options={options} />
                </div>
            </div>
            <h3 className={styles.roster}>Team Roster</h3>
            <p>
                Below are the players sorted by most valuable to least valuable.
            </p>
            <div className={styles.cards}>
                {rosters["player_details"] != undefined
                    ? rosters["player_details"]
                          .sort((a, b) => b.Value - a.Value)
                          .map((player) => {
                                if(player["Name"] == undefined){
                                    return <></>
                                }

                              return (
                                  <div className={styles.playerCard}>
                                      <h3 className={styles.playerName}>
                                          {player["Name"]}
                                      </h3>
                                      <p className={styles.playerPos}>
                                          {" "}
                                          {player["Positions"]} {player["Age"]}{" "}
                                          y.o.
                                      </p>
                                      <div
                                          className={
                                              styles.playerImageContainer
                                          }
                                      >
                                          <div className={styles.playerImage}>
                                              <Image
                                                  alt="Player Image."
                                                  src={`https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${player["id"]}.png&w=350&h=254`}
                                                  width={350}
                                                  height={254}
                                                  layout="responsive"
                                              />
                                          </div>
                                      </div>
                                      <div className={styles.additionalDetails}>
                                          <p>Trade Value</p>
                                          <b>{player["Value"]}</b>
                                      </div>
                                  </div>
                              );
                          })
                    : ""}
            </div>
        </div>
    );
}
