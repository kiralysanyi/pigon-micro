import express, { Application } from "express";
import fs from "fs";

const webuiHost = (app: Application) => {
    // host client if available
    if (fs.existsSync("./public")) {
        console.log("Hosting client")
        app.use(express.static("./public"))
        app.use((req, res) => {
            res.sendFile("index.html", { root: "./public" })
        })
    }
}

export default webuiHost;