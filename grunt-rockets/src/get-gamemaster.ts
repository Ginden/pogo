import { tmpdir } from "node:os";

import { fileURLToPath } from "url";
import process from "process";
import path from "node:path";
import fs from "node:fs/promises";
import { GameMaster, GameMasterPokemon } from "./types";
import { pick } from "lodash-es";

const gamemasterPath = path.join(tmpdir(), "gamemaster.json");

export async function getGameMaster(): Promise<GameMaster> {
  return JSON.parse(await fs.readFile(gamemasterPath, "utf-8"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const response = await fetch(
    "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json",
  );
  const gamemaster = await response.json();
  const ret: Record<string, any> = {
    pokemonTags: gamemaster.pokemonTags,
    pokemon: gamemaster.pokemon.map((p: any) =>
      pick(p, [
        "speciesId",
        "speciesName",
        "baseStats",
        "types",
        "tags",
        "fastMoves",
        "released",
      ] satisfies Array<keyof GameMasterPokemon>),
    ),
    moves: gamemaster.moves.map((m: any) =>
      pick(m, [
        "moveId",
        "name",
        "type",
        "power",
        "energy",
        "duration",
        "energyGain",
        "cooldown",
      ]),
    ),
  };

  await fs.writeFile(gamemasterPath, JSON.stringify(ret, null, 1));
  console.log(`GameMaster written to ${gamemasterPath}`);
}
