import fs from "node:fs/promises";
import path from "node:path";
import {baseOptions, variants} from "./settings.ts";
import {rocketFinderCalculator} from "./rocket-finder.ts";

await fs.mkdir(path.join(process.cwd(), 'debug')).catch(e => {
    if (e.code !== 'EEXIST') throw e;
});

for (const variant of variants) {
    const filePath = path.join(process.cwd(), 'debug', `${variant.fileName}.json`);
    const data = await rocketFinderCalculator({
        ...baseOptions,
        ...variant.options,
        write: () => {}
    });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}
