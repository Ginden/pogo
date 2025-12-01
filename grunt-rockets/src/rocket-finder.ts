import { getGameMaster } from "./get-gamemaster.ts";
import { capitalizeFirstLetter, percentOf } from "./helpers.ts";
import type { PokemonType } from "./types";
import { typeEmoji } from "./type-emoji.ts";
import { getPokemonMoveVariants } from "./calculator/get-move-variants.ts";
import { getPokemon } from "./calculator/get-filtered-pokemon.ts";
import { calculateTypePairDamageModifier } from "./calculator/calculate-type-pair-damage-modifier.ts";
import { pokemonTypes } from "./game-constants.ts";
import { sortBy } from "lodash-es";

export interface RocketFinderOptions {
  entriesLimit: number;
  excludedSpecies: Set<string>;
  excludedTags: Set<string>;
  excludeUnreleased: boolean;
  attackIv: number;
  write: (data: string) => void;
}

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

  const types = pokemonTypes;

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
      const damageData = pokemonMoveVariant.map((variant) => {
        const attackType = variant.selectedFastAttack.type;
        const damageModifier = calculateTypePairDamageModifier(attackType, [
          defendingType,
        ]);
        return {
          ...variant,
          effectiveDps: variant.dps * damageModifier,
        };
      });

      return [
        defendingType as PokemonType,
        sortBy(
          damageData,
          (v) => -v.effectiveDps,
          (v) => v.selectedFastAttack.cooldown,
          (v) => v.pokemon.speciesName,
        ),
      ];
    }),
  );

  const bestByAttackType = Object.fromEntries(
    [...types].map((t) => {
      const variants = pokemonMoveVariant.filter(
        (variant) => variant.selectedFastAttack.type === t,
      );
      return [
        t as PokemonType,
        sortBy(
          variants,
          (v) => -v.dps,
          (v) => v.selectedFastAttack.cooldown,
          (v) => v.pokemon.speciesName,
        ),
      ];
    }),
  ) as { [p in PokemonType]: typeof pokemonMoveVariant };

  return {
    bestByDefenderType: bestByDefenderType as {
      [p in PokemonType]: (typeof bestByDefenderType)[string];
    },
    bestByAttackType,
  };
}

export function markdownRocketFinderPrinter(
  data: Awaited<ReturnType<typeof rocketFinderCalculator>>,
  {
    excludedTags,
    excludeUnreleased,
    excludedSpecies,
    attackIv,
    entriesLimit,
    write,
  }: RocketFinderOptions,
) {
  // Printing data

  write("# Generation details \n");

  write(`* **Excluded tags**: ${[...excludedTags].join(", ") || "none"}`);
  write(`* **Exclude unreleased**: ${excludeUnreleased}`);
  write(`* **Date generated**: ${new Date().toISOString().slice(0, 10)}`);
  write(`* **Excluded Pokemon**: ${[...excludedSpecies].join(", ")}`);
  write(`* **Attack IV assumed**: ${attackIv}`);

  for (const [defenderType, bestVariants] of Object.entries(
    data.bestByDefenderType,
  )) {
    const emoji = typeEmoji[defenderType as PokemonType];
    write(``);
    write(`# Anti-${capitalizeFirstLetter(defenderType)} ${emoji}`);
    write("");

    const variantsToShow = bestVariants.slice(0, entriesLimit);

    const [highestDamageVariant] = variantsToShow;
    for (const variant of variantsToShow) {
      write(
        `* **${variant.pokemon.speciesName}** using _${variant.selectedFastAttack.name}_ (${percentOf(variant.dps, highestDamageVariant.dps)})`,
      );
    }
  }

  write(`----`);

  write(`# Highest DPS by damage type`);
  const highestDpsPokemon = Object.values(data.bestByAttackType)
    .flat()
    .toSorted((a, b) => b.dps - a.dps)[0];
  write(
    `All Pokemon are normalized to neutral damage of ${highestDpsPokemon.pokemon.speciesName} using ${highestDpsPokemon.selectedFastAttack.name}`,
  );

  for (const [type, bestOfType] of Object.entries(data.bestByAttackType)) {
    const variantsToShow = bestOfType.slice(0, entriesLimit);
    const emoji = typeEmoji[type as PokemonType];
    write("\n");
    write(`### Highest **${type}** (${emoji}) fast move damage: `);
    write("\n");
    for (const variant of variantsToShow) {
      write(
        `* **${variant.pokemon.speciesName}** using _${variant.selectedFastAttack.name}_ (${percentOf(variant.dps, highestDpsPokemon.dps)})`,
      );
    }
  }
}

export async function generateRocketMarkdownReport(
  options: RocketFinderOptions,
) {
  const data = await rocketFinderCalculator(options);
  markdownRocketFinderPrinter(data, options);
}
