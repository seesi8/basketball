import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

async function find_matching_row(player) {
    const csvFilePath = path.join(process.cwd(), "public", "players.csv");

    // Read the CSV file
    const csvData = fs.readFileSync(csvFilePath, "utf-8");

    // Parse the CSV data
    const records = parse(csvData, {
        columns: true, // Automatically generate headers
        skip_empty_lines: true, // Skip empty rows
        trim: true, // Trim whitespace from values
    });

    // Find the matching row by `original_key`
    const matchingRow = records.find((row) => row.original_key === player);

    return matchingRow;
}

export async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const player = searchParams.get("player");

        if (!player) {
            return new Response(
                JSON.stringify({ error: "player is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        let matchingRow;

        if (player.includes("|")) {
            //pick
            const realPick = player.split("|")[0];
            //|| parseInt(realPick.split("rd")[0]) < 2026
            if ((parseInt(realPick.split("rd")[1]) > 2) ) {
                matchingRow = {
                    Rank: "0",
                    Name: player,
                    Age: "0",
                    Team: "NBA",
                    Positions: "P",
                    Value: "0",
                    original_key: realPick,
                    sport: "nba",
                    number: "0",
                    active: "TRUE",
                    depth_chart_position: "P",
                    birth_day: "2000-01-01",
                    status: "ACT",
                    years_exp: "0",
                    depth_chart_order: "0",
                    height: "0",
                    weight: "0",
                    college: "",
                    team: "NBA",
                    both: "TRUE",
                    cleaned_name: realPick,
                    id: "",
                };
            } else {
                console.log(realPick)
                matchingRow = await find_matching_row(realPick);
                matchingRow["Name"] = player;
            }
        } else {
            matchingRow = await find_matching_row(player);
        }

        if (!matchingRow) {
            return new Response(JSON.stringify({ error: "Player not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Respond with the matching row
        return new Response(JSON.stringify(matchingRow), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
