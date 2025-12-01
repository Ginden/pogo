import {generateRocketMarkdownReport, RocketFinderOptions} from "./rocket-finder";
import { mkdir } from "fs/promises";
import { writeFile } from "node:fs/promises";

const baseOptions = {
  entriesLimit: 7,
  attackIv: 15,
  excludedSpecies: new Set<string>(["ditto", "deoxys_attack"]),
  excludeUnreleased: true,
} satisfies Partial<RocketFinderOptions>;

const variants = [
  {
    linkDescription: "All species",
    fileName: "all-species",
    options: {
      excludedTags: new Set([]),
      ...baseOptions,
    },
  },
  {
    fileName: "no-shadow",
    linkDescription: "No shadow",
    options: {
      excludedTags: new Set(["shadow"]),
      ...baseOptions,
    },
  },
  {
    fileName: "no-shadow-no-mega",
    linkDescription: "No shadow, no Mega",
    options: {
      excludedTags: new Set(["shadow", "mega"]),
      ...baseOptions,
    },
  },
  {
    fileName: "no-mega",
    linkDescription: "No Mega",
    options: {
      excludedTags: new Set(["mega"]),
      ...baseOptions,
    },
  },
  {
    fileName: "regular-only",
    linkDescription: "Regular only (no shadow, mega, legendary, mythical)",
    options: {
      excludedTags: new Set([
        "shadow",
        "mega",
        "legendary",
        "mythical",
        "ultrabeast",
      ]),
      ...baseOptions,
    },
  },
] satisfies Array<{
  options: Omit<RocketFinderOptions, "write">;
  linkDescription: string;
  fileName: string;
}>;

const outputDirectory = process.argv[2];
if (!outputDirectory) {
  throw new Error("Output directory must be provided as the first argument");
}
await mkdir(outputDirectory, { recursive: true });

for (const { options, linkDescription, fileName } of variants) {
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
