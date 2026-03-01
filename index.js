import express from "express";
import { PORT } from "./app/config/env.js"

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.listen(PORT, () => {
    console.log(`Server started on port http://localhost:${PORT}`);
});
