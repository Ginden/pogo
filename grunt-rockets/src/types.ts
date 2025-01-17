export type PokemonType =
  | "normal"
  | "fighting"
  | "flying"
  | "poison"
  | "ground"
  | "rock"
  | "bug"
  | "ghost"
  | "steel"
  | "fire"
  | "water"
  | "grass"
  | "electric"
  | "psychic"
  | "ice"
  | "dragon"
  | "dark"
  | "fairy";

export type RawPokemonType = PokemonType | "none";

export type GameMasterPokemon = {
  speciesId: string;
  speciesName: string;
  baseStats: {
    atk: number;
    def: number;
    hp: number;
  };
  types: [RawPokemonType, RawPokemonType];
  fastMoves: string[];
  chargedMoves: string[];
  tags: string[];
  released: boolean;
};
export type GameMasterMove = {
  moveId: string;
  name: string;
  type: PokemonType;
  power: number;
  energyGain: number;
  cooldown: number;
};

export type GameMaster = {
  pokemonTags: string[];
  pokemon: GameMasterPokemon[];
  moves: GameMasterMove[];
};
