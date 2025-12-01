import { GameMaster, GameMasterPokemon } from "../types";
import { shadowBonus, stab } from "../game-constants";

interface PokemonMoveVariantBase {
  pokemon: GameMasterPokemon;
  selectedFastAttack: GameMaster["moves"][number];
}

interface PokemonMoveVariant extends PokemonMoveVariantBase {
  dps: number;
}

export function getPokemonMoveVariants({
  pokemon,
  moves,
  attackIv = 15,
}: {
  moves: GameMaster["moves"];
  pokemon: GameMasterPokemon[];
  attackIv?: number;
}): PokemonMoveVariant[] {
  // All fast moves

  const movesMap = Object.fromEntries(
    moves.filter((m) => m.energyGain).map((m) => [m.moveId, m]),
  );

  const baseVariants: PokemonMoveVariantBase[] = pokemon.flatMap((poke) => {
    const { fastMoves } = poke;
    return fastMoves.map((fm) => ({
      pokemon: poke,
      selectedFastAttack: movesMap[fm] ?? (null as any).foo,
    }));
  });

  return baseVariants.map(({ pokemon, selectedFastAttack }) => {
    const {
      baseStats: { atk },
      types,
      tags,
    } = pokemon;
    const moveType = selectedFastAttack.type;
    let dps = selectedFastAttack.power / (selectedFastAttack.cooldown / 500);
    const isShadow = (tags ?? []).includes("shadow");
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
      pokemon,
      selectedFastAttack,
      dps,
    };
  });
}
