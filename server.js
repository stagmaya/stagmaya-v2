/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("http");
const next = require("next");
const { parse } = require("url");

const url = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:80"
const port = 80;
const dev = process.env.NODE_ENV === "DEV";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    }).listen(port, (err) => {
        if (err) throw err;
        console.log(`Server Running on: ${url}`);
    });
});