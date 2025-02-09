import { configDotenv } from "dotenv";
import pkg from "pg";

const { Pool } = pkg;

configDotenv();

const pool = new Pool({
    // user: process.env.DB_USER,
    // host: process.env.DB_HOST,
    // database: process.env.DB_DATABASE,
    // password: process.env.DB_PASSWORD,
    // port: process.env.DB_PORT
    connectionString: process.env.DB_URL,
    ssl: {
        rejectUnauthorized: false, // Allow self-signed SSL
      },
})

export default pool;