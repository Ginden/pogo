import { fileURLToPath } from "node:url";
import * as fs from "node:fs/promises";
import { GamemasterJSON } from "./gamemaster.json.types.js";
import {getDb} from "./database/db.js";
import { runPrepareQueries } from "./database/run-prepare-queries.js";
import {nukeDatabase} from "./database/nuke-database.js";

const fileUrl = fileURLToPath(import.meta.url);

console.log({argv1: process.argv[1], fileUrl});


if (process.argv[1] === fileUrl) {
  const filePath = process.argv[2];
  const content: GamemasterJSON = JSON.parse(
    await fs.readFile(filePath, "utf-8"),
  );
  await using db = await getDb();
  await nukeDatabase(db);
  await runPrepareQueries(db);
}
