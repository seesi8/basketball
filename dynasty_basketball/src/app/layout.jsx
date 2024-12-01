"use client"

import localFont from "next/font/local";
import "./styles/globals.css";
import Header from "./components/header"
import { Roboto_Flex } from 'next/font/google'
import Sidebar from "./components/sidebar";

const roboto = Roboto_Flex({ subsets: ['latin'], weight: "variable" })

export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body className={`${roboto.className}`}>
        <div style={{positon: "absolute"}}>
          <Header/>
          <Sidebar/>
        </div>
        {children}
      </body>
    </html>
  );
}
