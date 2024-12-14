import Image from "next/image";
import styles from "../styles/trade.module.css";
import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import { Graph } from "react-d3-graph";
import ForceGraph2D from 'react-force-graph-2d';

async function get_team_name(userID) {
    return fetch(
        "/api/team?" +
            new URLSearchParams({
                userID: userID,
                leaugeID: getCookie("leaugeID"),
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            if (value["metadata"]["team_name"]) {
                return value["metadata"]["team_name"];
            } else {
                return `Team ${value["display_name"]}`;
            }
        });
}

export default function Trade({ userID }) {
    const [teamName, setTeamName] = useState("");

    const data = {
        "nodes": [ 
            { 
              "id": "id1",
              "name": "name1",
              "color": "blue"
            },
            { 
              "id": "id2",
              "name": "name2",
              "color": "red"
            },
            
        ],
        "links": [
            {
                "source": "id1",
                "target": "id2",
                "color": "white"
            },
            
        ]
    };

    useEffect(() => {
        get_team_name(userID).then((value) => {
            setTeamName(value);
        });
    }, []);

    return (
        <div className={styles.page}>
            {" "}
            {/* <h3 className={styles.title}>Activity Feed</h3> */}
            <div className={styles.container}>
                <div style={{ width: "100%", height: "800px" }}>
                    <ForceGraph2D
                        graphData={data}
                        linkDirectionalArrowLength={4}
                        linkWidth={2}
                        linkCurvature={0.5}
                        linkDirectionalArrowRelPos={1}
                        enableZoomInteraction={false}
                        enablePanInteraction={false}
                        nodeCanvasObjectMode={() => "after"}
                        nodeCanvasObject={(node, ctx, globalScale) => {
                            const nodeLabel = node.name;
                            const fontSize = 12 / globalScale;
                            ctx.font = `${fontSize}px Sans-Serif`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "black";
                            ctx.fillText(nodeLabel, node.x, node.y);
                          }}
                          nodeRelSize={10}
                    />
                </div>
            </div>
        </div>
    );
}
