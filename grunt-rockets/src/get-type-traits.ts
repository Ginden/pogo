import type { PokemonType } from "./types.ts";

export type PokemonTypeDescription = {
  weaknesses: PokemonType[];
  resistances: PokemonType[];
  immunities: PokemonType[];
};

export function getTypeTraits(type: PokemonType): PokemonTypeDescription {
  // https://github.com/pvpoke/pvpoke/blob/c5379abe4bad8432a539bf4c9fe33e99d77d5b2c/src/js/battle/Battle.js#L289
  let traits: PokemonTypeDescription = {
    weaknesses: [],
    resistances: [],
    immunities: [],
  };

  switch (type) {
    case "normal":
      return {
        resistances: [],
        weaknesses: ["fighting"],
        immunities: ["ghost"],
      };

    case "fighting":
      return {
        resistances: ["rock", "bug", "dark"],
        weaknesses: ["flying", "psychic", "fairy"],
        immunities: [],
      };

    case "flying":
      return {
        resistances: ["fighting", "bug", "grass"],
        weaknesses: ["rock", "electric", "ice"],
        immunities: ["ground"],
      };

    case "poison":
      return {
        resistances: ["fighting", "poison", "bug", "fairy", "grass"],
        weaknesses: ["ground", "psychic"],
        immunities: [],
      };

    case "ground":
      return {
        resistances: ["poison", "rock"],
        weaknesses: ["water", "grass", "ice"],
        immunities: ["electric"],
      };

    case "rock":
      return {
        resistances: ["normal", "flying", "poison", "fire"],
        weaknesses: ["fighting", "ground", "steel", "water", "grass"],
        immunities: [],
      };

    case "bug":
      return {
        resistances: ["fighting", "ground", "grass"],
        weaknesses: ["flying", "rock", "fire"],
        immunities: [],
      };

    case "ghost":
      return {
        resistances: ["poison", "bug"],
        weaknesses: ["ghost", "dark"],
        immunities: ["normal", "fighting"],
      };

    case "steel":
      return {
        resistances: [
          "normal",
          "flying",
          "rock",
          "bug",
          "steel",
          "grass",
          "psychic",
          "ice",
          "dragon",
          "fairy",
        ],
        weaknesses: ["fighting", "ground", "fire"],
        immunities: ["poison"],
      };

    case "fire":
      return {
        resistances: ["bug", "steel", "fire", "grass", "ice", "fairy"],
        weaknesses: ["ground", "rock", "water"],
        immunities: [],
      };

    case "water":
      return {
        resistances: ["steel", "fire", "water", "ice"],
        weaknesses: ["grass", "electric"],
        immunities: [],
      };

    case "grass":
      return {
        resistances: ["ground", "water", "grass", "electric"],
        weaknesses: ["flying", "poison", "bug", "fire", "ice"],
        immunities: [],
      };

    case "electric":
      return {
        resistances: ["flying", "steel", "electric"],
        weaknesses: ["ground"],
        immunities: [],
      };

    case "psychic":
      return {
        resistances: ["fighting", "psychic"],
        weaknesses: ["bug", "ghost", "dark"],
        immunities: [],
      };

    case "ice":
      return {
        resistances: ["ice"],
        weaknesses: ["fighting", "fire", "steel", "rock"],
        immunities: [],
      };

    case "dragon":
      return {
        resistances: ["fire", "water", "grass", "electric"],
        weaknesses: ["dragon", "ice", "fairy"],
        immunities: [],
      };

    case "dark":
      return {
        resistances: ["ghost", "dark"],
        weaknesses: ["fighting", "fairy", "bug"],
        immunities: ["psychic"],
      };

    case "fairy":
      return {
        resistances: ["fighting", "bug", "dark"],
        weaknesses: ["poison", "steel"],
        immunities: ["dragon"],
      };
  }

  throw new Error(`Unknown type: ${type}`);
}
