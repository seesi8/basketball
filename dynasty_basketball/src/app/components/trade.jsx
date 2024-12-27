import styles from "../styles/trade.module.css";
import { useEffect, useState, useRef } from "react";
import { getCookie } from "cookies-next";
import { Graph } from "react-d3-graph";
import ForceGraph2D from "react-force-graph-2d";

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
function resizeToProportions(num1, num2, size) {
    // Identify the larger number
    const max = Math.max(num1, num2);
    const min = Math.min(num1, num2);

    // Calculate the scaling factor
    const scale = size / max;

    // Scale both numbers
    const newMax = max * scale;
    const newMin = min * scale;

    // Return the results in the same order
    return num1 > num2 ? [newMax, newMin] : [newMin, newMax];
}

async function get_connections(userID) {
    return fetch(
        "/api/connections?" +
            new URLSearchParams({
                userID: userID,
                leaugeID: getCookie("leaugeID"),
            }).toString()
    )
        .then((res) => {
            return res.json();
        })
        .then((value) => {
            return value;
        });
}

export default function Trade({ userID }) {
    const [teamName, setTeamName] = useState("");

    const [data, setData] = useState(undefined);
    const ref = useRef();

    const [images, setImages] = useState({}); // Cache for preloaded images

    useEffect(() => {
        if (!ref.current) {
            return;
        }
        ref.current.d3Force("charge").strength(-700);
        ref.current.d3Force("link").distance(80);
        ref.current.d3Force("charge").distanceMax(140);
    }, [data]);

    useEffect(() => {
        get_team_name(userID).then((value) => {
            setTeamName(value);
        });
        get_connections(userID).then((value) => {
            setData(value);
        });
    }, []);

    const preloadImage = (url) => {
        const img = new Image();
        img.src = url;

        return img;
    };

    return (
        <div className={styles.page}>
            {" "}
            {/* <h3 className={styles.title}>Activity Feed</h3> */}
            <div className={styles.container}>
                <div style={{ width: "100%", height: "800px" }}>
                    {data ? (
                        <ForceGraph2D
                            graphData={data}
                            linkDirectionalArrowLength={10}
                            linkWidth={2}
                            linkCurvature={0.5}
                            linkDirectionalArrowRelPos={1}
                            enableZoomInteraction={false}
                            enablePanInteraction={false}
                            zoomToFit={0}
                            nodeAutoColorBy="group"
                            ref={ref}
                            nodeCanvasObjectMode={() => "after"}
                            nodeCanvasObject={(node, ctx, globalScale) => {
                                // Draw the background image
                                const img = preloadImage(node.image_id); // node.image should be the URL of the image
                                const size = 70; // Set size for the image
                                const [sizex, sizey] = resizeToProportions(
                                    img.width,
                                    img.height,
                                    size
                                );

                                console.log("thing 1")

                                img.onload = () => {
                                    console.log("thing 2")
                                    // Save the canvas state
                                    ctx.save();

                                    // Create a clipping path
                                    ctx.beginPath();
                                    ctx.arc(
                                        node.x,
                                        node.y,
                                        21,
                                        0,
                                        2 * Math.PI,
                                        false
                                    );
                                    ctx.clip();

                                    // Draw the image
                                    ctx.drawImage(
                                        img,
                                        node.x - sizex / 2,
                                        node.y - sizey / 2,
                                        sizex,
                                        sizey
                                    );

                                    // Restore the canvas state
                                    ctx.restore();

                                    // Draw the border
                                    ctx.beginPath();
                                    ctx.arc(
                                        node.x,
                                        node.y,
                                        22.5,
                                        0,
                                        2 * Math.PI,
                                        false
                                    );
                                    ctx.lineWidth = 3; // Border thickness
                                    ctx.strokeStyle = "#808080"; // Border color
                                    ctx.stroke();

                                    // Draw the node label
                                    const fontSize = 12 / globalScale;
                                    ctx.font = `bold ${fontSize}px Sans-Serif`; // Make the font bold
                                    ctx.textAlign = "center";
                                    ctx.textBaseline = "start";
                                    ctx.fillStyle = "black";

                                    // Draw multiple strokes to simulate extra-bold outline
                                    ctx.strokeStyle = "#808080";
                                    ctx.lineWidth = 2; // Thicker stroke width
                                    for (let dx = -0.5; dx <= 0.5; dx += 0.5) {
                                        for (
                                            let dy = -0.5;
                                            dy <= 0.5;
                                            dy += 0.5
                                        ) {
                                            ctx.strokeText(
                                                node.name,
                                                node.x + dx,
                                                node.y + size / 2 - 10 + dy
                                            );
                                        }
                                    }

                                    // Fill the text
                                    ctx.fillStyle = "black";
                                    ctx.fillText(
                                        node.name,
                                        node.x,
                                        node.y + size / 2 - 10
                                    );
                                };
                            }}
                            nodeRelSize={25}
                            onNodeClick={() => null}
                            onNodeDrag={() => {}}
                            enableNodeDrag={false}
                        />
                    ) : (
                        <></>
                    )}
                </div>
            </div>
        </div>
    );
}
