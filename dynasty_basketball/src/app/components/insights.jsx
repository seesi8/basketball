import Image from "next/image";
import styles from "../styles/insights.module.css";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { getCookie } from "cookies-next";

async function total_points(userID) {
    return fetch(
        "/api/pointsByWeek?" +
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

async function getMetrics(userID) {
    return fetch(
        "/api/metrics?" +
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

function transformData(inputData) {
    const labels = Object.keys(inputData).map((item) => `Week ${item}`);

    // Extract pointsFor and pointsAgainst into arrays
    const pointsFor = Object.values(inputData).map((item) => item.pointsFor);
    const pointsAgainst = Object.values(inputData).map(
        (item) => item.pointsAgainst
    );

    // Construct and return the data object
    return {
        labels: labels,
        datasets: [
            {
                label: "Fantasy Points",
                data: pointsFor,
                borderColor: "#00c8f3",
                backgroundColor: "rgba(0, 200, 243, 0.3)",
                tension: 0.2,
                pointStyle: "circle",
                pointRadius: 5,
                pointBackgroundColor: "#00c8f3",
                pointBorderColor: "rgba(0, 0, 0, 0)",
                fill: true,
            },
            {
                label: "Opponent Points",
                data: pointsAgainst,
                borderColor: "#f30087",
                backgroundColor: "rgba(243, 0, 135, 0.3)",
                tension: 0.2,
                pointStyle: "circle",
                pointRadius: 5,
                pointBackgroundColor: "#f30087",
                pointBorderColor: "rgba(0, 0, 0, 0)",
            },
        ],
    };
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

export default function Insights({ userID }) {
    // Register Chart.js modules
    ChartJS.register(
        CategoryScale,
        LinearScale,
        PointElement,
        LineElement,
        Title,
        Tooltip,
        Legend,
        Filler
    );

    const [weeks, setWeeks] = useState({});
    const [data, setData] = useState(undefined);
    const [week, setWeek] = useState(undefined);
    const [metrics, setMetrics] = useState(undefined);

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: "#fff",
                    boxWidth: 20,
                },
            },
            title: {
                display: true,
                text: "Weekly Points Vs. Opponents",
                color: "#fff",
                font: {
                    size: 18,
                    weight: "bold",
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    color: "#fff",
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                        size: 10,
                    },
                },
                title: {
                    display: true,
                    text: "MatchUp",
                    color: "#fff",
                    font: {
                        size: 12,
                        weight: "bold",
                    },
                },
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: "#fff",
                    beginAtZero: true, // Ensures the scale starts at 0
                },
                title: {
                    display: true,
                    text: "Fantasy Points",
                    color: "#fff",
                    font: {
                        size: 12,
                        weight: "bold",
                    },
                },
            },
        },
    };

    useEffect(() => {
        total_points(userID).then((data) => {
            setWeeks(data);
            setData(transformData(data));
        });
        getWeek().then((data) => {
            setWeek(data);
        });
        getMetrics(userID).then((data) => {
            setMetrics(data);
        });
    }, []);

    return (
        <div className={styles.page}>
            {" "}
            <div className={styles.chart}>
                {data != undefined ? (
                    <Line data={data} options={options} />
                ) : (
                    ""
                )}
            </div>
            <div className={styles.metrics}>
                <h3>Season Metrics</h3>
                {metrics != undefined ? (
                    <>
                        <p className={styles.metricItem}>
                            Games Played{" "}
                            <span className={styles.bold}>{week}</span>
                        </p>
                        <p className={styles.metricItem}>
                            Points For{" "}
                            <span className={styles.bold}>
                                {metrics["totalPoints"]}
                            </span>
                        </p>
                        <p className={styles.metricItem}>
                            Highest Score{" "}
                            <span className={styles.bold}>
                                {metrics["high"]}
                            </span>
                        </p>
                        <p className={styles.metricItem}>
                            Low Score{" "}
                            <span className={styles.bold}>
                                {metrics["low"]}
                            </span>
                        </p>
                        <p className={styles.metricItem}>
                            Average Points Per Week{" "}
                            <span className={styles.bold}>
                                {isNaN(parseInt(metrics["avg"]))
                                    ? ""
                                    : parseInt(metrics["avg"])}
                            </span>
                        </p>
                        <p className={styles.metricItem}>
                            Variance{" "}
                            <span className={styles.bold}>
                                {isNaN(parseInt(metrics["var"]))
                                    ? ""
                                    : parseInt(metrics["var"])}
                            </span>
                        </p>
                        <p className={styles.metricItem}>
                            Standard Deviation{" "}
                            <span className={styles.bold}>
                                {isNaN(parseInt(metrics["std"]))
                                    ? ""
                                    : parseInt(metrics["std"])}
                            </span>
                        </p>
                        <p className={styles.metricItem}>
                            Points Against{" "}
                            <span className={styles.bold}>
                                {isNaN(parseInt(metrics["totalPointsAgainst"]))
                                    ? ""
                                    : parseInt(metrics["totalPointsAgainst"])}
                            </span>
                        </p>
                    </>
                ) : (
                    ""
                )}
            </div>
        </div>
    );
}
