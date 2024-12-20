"use client";

import Image from "next/image";
import Trade from "../components/trade";

export default function Home() {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
                padding: "10rem",
            }}
        >
            <Trade userID={"1048390222041427968"} />
        </div>
    );
}
