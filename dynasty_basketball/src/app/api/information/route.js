import { cookies } from "next/headers";
import { getFormatedRosters } from "@/app/helpers/functions";

export async function GET(request) {
  console.log("----------------------------")
    try {
        const searchParams = request.nextUrl.searchParams;
        const leagueID = searchParams.get("leagueID");
        const userID = searchParams.get("userID");

        if (!leagueID) {
            return new Response(
                JSON.stringify({ error: "leagueID is required" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const response = await fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/rosters`
        );
        if (!response.ok) {
            return new Response(
                JSON.stringify({ error: "Failed to fetch data" }),
                {
                    status: response.status,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        const data = await response.json();

        const formatedRosters = await getFormatedRosters(data, userID, leagueID);

        return new Response(JSON.stringify(formatedRosters), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
      console.log(error)
        return new Response(
            JSON.stringify({ error: "Internal Server Error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
