import {generateRocketMarkdownReport } from "./rocket-finder.ts";
import { mkdir } from "fs/promises";
import { writeFile } from "node:fs/promises";
import {variants} from "./settings.ts";



const outputDirectory = process.argv[2];
if (!outputDirectory) {
  throw new Error("Output directory must be provided as the first argument");
}
await mkdir(outputDirectory, { recursive: true });

for (const { options, fileName } of variants) {
  const filePath = `${outputDirectory}/${fileName}.md`;
  const contentArray: string[] = [];
  await generateRocketMarkdownReport({
    ...options,
    write: (data) => contentArray.push(data),
  });
  await writeFile(filePath, contentArray.join("\n"));
}

const indexContent =
  `Available variants: \n\n` +
  variants
    .map(
      ({ linkDescription, fileName }) =>
        `* [${linkDescription}](${fileName}.md)`,
    )
    .join("\n");

await writeFile(`${outputDirectory}/index.md`, indexContent);
