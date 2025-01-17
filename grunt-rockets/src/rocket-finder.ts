import { getGameMaster } from "./get-gamemaster.js";
import {
  damageReduction,
  shadowBonus,
  stab,
  superEffectiveDamage,
} from "./game-constants.js";
import { capitalizeFirstLetter, percentOf } from "./helpers.js";
import { getTypeTraits, PokemonTypeDescription } from "./get-type-traits.js";
import type { PokemonType } from "./types";
import { typeEmoji } from "./type-emoji.js";

export type RocketFinderOptions = {
  entriesLimit: number;
  excludedSpecies: Set<string>;
  excludedTags: Set<string>;
  excludeUnreleased: boolean;
  attackIv: number;
  write: (data: string) => void;
};

export async function rocketFinder({
  entriesLimit,
  excludedSpecies,
  excludeUnreleased,
  excludedTags,
  attackIv,
  write,
}: RocketFinderOptions) {
  function getPokemonMoveVariants() {
    return pokemon
      .filter((p) => (excludeUnreleased ? p.released : true))
      .filter((p) => !excludedSpecies.has(p.speciesId))
      .filter(({ tags }) => {
        if (!tags?.length) {
          return true;
        }
        return new Set(tags).isDisjointFrom(excludedTags);
      })
      .flatMap((poke) => {
        const {
          speciesName,
          fastMoves,
          types,
          tags,
          baseStats: { atk },
        } = poke;
        const isShadow = (tags ?? []).includes("shadow");
        return fastMoves.map((fm) => ({
          speciesName,
          atk,
          types,
          isShadow,
          fastAttack: movesMap[fm] ?? (null as any).foo,
        }));
      })
      .map((x) => {
        const { speciesName, atk, types, isShadow, fastAttack } = x;
        const moveType = fastAttack.type;
        let dps = fastAttack.power / (fastAttack.cooldown / 500);
        const isStab = types.includes(moveType);
        if (isShadow) {
          dps *= shadowBonus;
        }
        if (isStab) {
          dps *= stab;
        }
        // This will be our synthetic metric to sort by
        dps *= atk + attackIv;
        dps = Math.round(dps);

        return {
          speciesName,
          fastAttack: fastAttack.name,
          dps,
          moveType,
        };
      });
  }

  const { pokemon, moves } = await getGameMaster();

  const types = new Set(moves.map((m) => m.type));
  const traits: { [p: string]: PokemonTypeDescription } = Object.fromEntries(
    [...types].map((t) => [t as PokemonType, getTypeTraits(t)]),
  );

  const fastMoves = moves.filter((m) => m.energyGain);

  const movesMap = Object.fromEntries(fastMoves.map((m) => [m.moveId, m]));

  const pokemonMoveVariant = getPokemonMoveVariants();

  const bestOfType: Record<
    string,
    ReturnType<typeof getPokemonMoveVariants>
  > = Object.fromEntries([...types].map((t) => [t, []]));
  const bestAgainstType: typeof bestOfType = JSON.parse(
    JSON.stringify(bestOfType),
  );

  // Calculations
  for (const type of types) {
    bestOfType[type] = pokemonMoveVariant
      .filter((m) => m.moveType === type)
      .sort((a, b) => a.dps - b.dps)
      .reverse()
      .slice(0, entriesLimit);
    const { resistances, weaknesses, immunities } = traits[type];
    const typesResistances = Object.fromEntries(
      [...types].map((damageType) => [
        damageType,
        resistances.includes(damageType)
          ? damageReduction
          : immunities.includes(damageType)
            ? damageReduction ** 2
            : weaknesses.includes(damageType)
              ? superEffectiveDamage
              : 1,
      ]),
    );

    bestAgainstType[type] = pokemonMoveVariant
      .map((a) => ({
        ...a,
        dps: a.dps * typesResistances[a.moveType],
      }))
      .sort((a, b) => a.dps - b.dps)
      .reverse()
      .slice(0, entriesLimit);
  }

  // Printing data

  write("# Generation details \n");

  write(`* **Excluded tags**: ${[...excludedTags].join(", ") || "none"}`);
  write(`* **Exclude unreleased**: ${excludeUnreleased}`);
  write(`* **Date generated**: ${new Date().toISOString().slice(0, 10)}`);
  write(`* **Excluded Pokemon**: ${[...excludedSpecies].join(", ")}`);
  write(`* **Attack IV assumed**: ${attackIv}`);

  for (const type of [...types].sort()) {
    const emoji = typeEmoji[type];
    write(``);
    write(`# Anti-${capitalizeFirstLetter(type)} ${emoji}`);
    write("");
    const [highestDamageVariant] = bestAgainstType[type];
    for (const variant of bestAgainstType[type]) {
      write(
        `* **${variant.speciesName}** using _${variant.fastAttack}_ (${percentOf(variant.dps, highestDamageVariant.dps)})`,
      );
    }
  }

  write(`----`);

  write(`# Highest DPS by damage type`);
  const highestDpsPokemon = pokemonMoveVariant
    .sort((a, b) => a.dps - b.dps)
    .reverse()
    .shift()!;
  write(
    `All Pokemon are normalized to neutral damage of ${highestDpsPokemon.speciesName} using ${highestDpsPokemon.fastAttack}`,
  );

  for (const type of [...types].sort()) {
    const emoji = typeEmoji[type];
    write("\n");
    write(`### Highest **${type}** (${emoji}) fast move damage: `);
    write("\n");
    for (const variant of bestOfType[type]) {
      write(
        `* **${variant.speciesName}** using _${variant.fastAttack}_ (${percentOf(variant.dps, highestDpsPokemon.dps)})`,
      );
    }
  }
}
