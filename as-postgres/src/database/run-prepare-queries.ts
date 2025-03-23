import { Client } from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import {sortBy} from "lodash-es";

export async function runPrepareQueries(db: Client) {
    const dirPath = path.join(process.cwd(), 'sql', 'prepare');
    const fileNames = await fs.readdir(dirPath);
    const sortedFileName = sortBy(fileNames, (fileName) => parseInt(fileName.split('-')[0]));

    for(const fileName of sortedFileName) {
        const filePath = path.join(dirPath, fileName);
        const query = await fs.readFile(filePath, 'utf-8');
        console.log(`Running ${fileName}`);
        await db.query(query);
    }
}
