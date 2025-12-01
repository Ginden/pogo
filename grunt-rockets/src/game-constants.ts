// Pokemon Go constants
import { type PokemonType } from "./types.ts";

export const stab = 1.2;
export const shadowBonus = 1.2;
export const damageReduction = 0.625;
export const superEffectiveDamage = 1.6;

export const pokemonTypes = Object.keys({
  bug: true,
  dark: true,
  dragon: true,
  electric: true,
  fairy: true,
  fighting: true,
  fire: true,
  flying: true,
  ghost: true,
  grass: true,
  ground: true,
  ice: true,
  normal: true,
  poison: true,
  psychic: true,
  rock: true,
  steel: true,
  water: true,
} as const satisfies Record<PokemonType, true>).sort((a, b) =>
  a.localeCompare(b),
) as PokemonType[];
