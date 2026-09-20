import { existsSync } from "node:fs";
import { loadConfig } from "./config.js";
import { openDb } from "./db.js";
import { createApp } from "./server.js";

const envFile = process.env.DOTENV_PATH ?? ".env";
if (existsSync(envFile)) process.loadEnvFile(envFile);

const config = loadConfig(process.env);
const db = openDb(process.env.DB_PATH ?? "data.sqlite");
const app = createApp({ db, config });

app.listen(config.port, () => {
  console.log(`jev-authorship-checker listening on http://localhost:${config.port}`);
});
