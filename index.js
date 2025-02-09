import express from "express";
import { configDotenv } from "dotenv";
import identifyCustomer from "./controller/identifyCustomer.js";

const app = express();
app.use(express.json());

configDotenv();

const PORT = process.env.PORT;

app.post('/identify', identifyCustomer);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})