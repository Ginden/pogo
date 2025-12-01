import { type RocketFinderOptions } from "./rocket-finder.ts";

export const baseOptions = {
  entriesLimit: 20,
  attackIv: 15,
  excludedSpecies: new Set<string>(["ditto", "deoxys_attack"]),
  excludeUnreleased: true,
} satisfies Partial<RocketFinderOptions>;

export const variants = [
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
