import express, { Application } from "express";
import fs from "fs";

const webuiHost = (app: Application) => {
    if (fs.existsSync("./public")) {
        console.log("Hosting client")
        app.use(express.static("./public"))
        
        app.use((req, res, next) => {
            if (req.path.startsWith("/api/") || req.path.startsWith("/socket")) {
                return next();
            }
            res.sendFile("index.html", { root: "./public" })
        })
    }
}

export default webuiHost;