
import localFont from "next/font/local";
import "./styles/globals.css";
import { Roboto_Flex } from "next/font/google";
import Sidebar from "./components/sidebar";
import Head from "next/head";

const roboto = Roboto_Flex({ subsets: ["latin"], weight: "variable" });

export const metadata = {
  title: "Dynasty-Basketball.com",
  description: "Best place for Dynasty Fantasy Basketball",
};


export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
            />
            <body className={`${roboto.className}`}>
                <div style={{ positon: "absolute" }}>
                    <Sidebar />
                </div>
                {children}
            </body>
        </html>
    );
}
