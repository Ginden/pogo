import type { PokemonType, RawPokemonType } from "../types.ts";
import { getTypeTraits } from "../get-type-traits.ts";
import { damageReduction, superEffectiveDamage } from "../game-constants.ts";

export function calculateTypePairDamageModifier(
  attackType: PokemonType,
  defenderTypes: [PokemonType] | [PokemonType, RawPokemonType],
): number {
  const defenderTraits = defenderTypes
    .filter((t): t is PokemonType => t !== "none")
    .map((t) => {
      return getTypeTraits(t as PokemonType);
    });

  let modifier = 1;

  for (const traits of defenderTraits) {
    if (traits.immunities.includes(attackType)) {
      modifier *= damageReduction * damageReduction;
    } else if (traits.weaknesses.includes(attackType)) {
      modifier *= superEffectiveDamage;
    } else if (traits.resistances.includes(attackType)) {
      modifier *= damageReduction;
    }
  }

  return modifier;
}
