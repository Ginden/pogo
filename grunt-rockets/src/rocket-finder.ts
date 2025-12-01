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
import { getPokemonMoveVariants } from "./calculator/get-move-variants";
import { getPokemon } from "./calculator/get-filtered-pokemon.js";
import { calculateTypePairDamageModifier } from "./calculator/calculate-type-pair-damage-modifier";

export type RocketFinderOptions = {
  entriesLimit: number;
  excludedSpecies: Set<string>;
  excludedTags: Set<string>;
  excludeUnreleased: boolean;
  attackIv: number;
  write: (data: string) => void;
};

export async function rocketFinderCalculator({
  excludedSpecies,
  excludeUnreleased,
  excludedTags,
  attackIv,
}: RocketFinderOptions) {
  const { moves } = await getGameMaster();

  const pokemon = await getPokemon({
    excludedSpecies,
    excludeUnreleased,
    excludedTags,
  });

  const types = new Set(moves.map((m) => m.type));
  const traits: { [p: string]: PokemonTypeDescription } = Object.fromEntries(
    [...types].map((t) => [t as PokemonType, getTypeTraits(t)]),
  );

  const pokemonMoveVariant = getPokemonMoveVariants({
    pokemon,
    moves,
    attackIv,
  });

  /**
   * Big map of best variants sorted by damage to defender type
   */
  const bestByDefenderType = Object.fromEntries(
    [...types].map((defendingType) => {
      return [
        defendingType as PokemonType,
        pokemonMoveVariant.map((variant) => {
          const attackType = variant.selectedFastAttack.type;
          const damageModifier = calculateTypePairDamageModifier(attackType, [
            defendingType,
          ]);
          return {
            ...variant,
            effectiveDps: variant.dps * damageModifier,
          };
        }),
      ];
    }),
  );

  const bestByAttackType: Record<PokemonType, typeof pokemonMoveVariant> =
    Object.fromEntries(
      [...types].map((t) => {
        return [t as PokemonType, []];
      }),
    );

  return {
    bestByDefenderType,
    bestByAttackType,
  };
}

export async function rocketFinder(options: RocketFinderOptions) {
  const { write, entriesLimit } = options;

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
      .filter((m) => m.selectedFastAttack.type === type)
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
        dps: a.dps * typesResistances[a.selectedFastAttack.type],
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
        `* **${variant.pokemon.speciesName}** using _${variant.selectedFastAttack.name}_ (${percentOf(variant.dps, highestDamageVariant.dps)})`,
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
    `All Pokemon are normalized to neutral damage of ${highestDpsPokemon.pokemon.speciesName} using ${highestDpsPokemon.selectedFastAttack.name}`,
  );

  for (const type of [...types].sort()) {
    const emoji = typeEmoji[type];
    write("\n");
    write(`### Highest **${type}** (${emoji}) fast move damage: `);
    write("\n");
    for (const variant of bestOfType[type]) {
      write(
        `* **${variant.pokemon.speciesName}** using _${variant.selectedFastAttack.name}_ (${percentOf(variant.dps, highestDpsPokemon.dps)})`,
      );
    }
  }
}
