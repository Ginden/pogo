export interface GamemasterJSON {
  /**
   * @ignore
   */
  readonly cups: unknown[];
  /**
   * @ignore
   */
  readonly formats: Format[];
  readonly moves: Move[];
  readonly pokemon: Pokemon[];
  readonly pokemonRegions: PokemonRegion[];
  readonly pokemonTags: Tag[];
  readonly pokemonTraits: PokemonTraits;
  readonly rankingScenarios: RankingScenario[];
  readonly settings: Settings;
  readonly shadowPokemon: string[];
  readonly timestamp: Date;
}

export interface TierRules {
  readonly floor: number;
  readonly max: number;
  readonly tiers: Tier[];
}

export interface Tier {
  readonly points: number;
  readonly pokemon: string[];
}

export interface Format {
  readonly cp: number;
  readonly cup: string;
  readonly hideRankings?: boolean;
  readonly meta: string;
  readonly showCup: boolean;
  readonly showFormat: boolean;
  readonly showMeta: boolean;
  readonly title: string;
  readonly rules?: string[];
}

export interface Move {
  readonly abbreviation?: string;
  readonly archetype?: string;
  readonly cooldown: number;
  readonly energy: number;
  readonly energyGain: number;
  readonly moveId: string;
  readonly name: string;
  readonly power: number;
  readonly type: PokemonType;
  readonly buffApplyChance?: string;
  readonly buffTarget?: BuffTarget;
  readonly buffs?: number[];
  readonly buffsOpponent?: number[];
  readonly buffsSelf?: number[];
}

export const BuffTarget = {
  Both: "both",
  Opponent: "opponent",
  Self: "self",
} as const;

export type BuffTarget = (typeof BuffTarget)[keyof typeof BuffTarget];

export const PokemonType = {
  Bug: "bug",
  Dark: "dark",
  Dragon: "dragon",
  Electric: "electric",
  Fairy: "fairy",
  Fighting: "fighting",
  Fire: "fire",
  Flying: "flying",
  Ghost: "ghost",
  Grass: "grass",
  Ground: "ground",
  Ice: "ice",
  None: "none",
  Normal: "normal",
  Poison: "poison",
  Psychic: "psychic",
  Rock: "rock",
  Steel: "steel",
  Water: "water",
} as const;

export const PokemonTypeOrNone = {
  ...PokemonType,
  None: "none",
} as const;

export type PokemonTypeOrNone =
  (typeof PokemonTypeOrNone)[keyof typeof PokemonTypeOrNone];

export type PokemonType = (typeof PokemonType)[keyof typeof PokemonType];

export interface Pokemon {
  readonly baseStats: BaseStats;
  readonly buddyDistance?: number;
  readonly chargedMoves: string[];
  readonly defaultIVs: { [key: string]: number[] };
  readonly dex: number;
  readonly family?: Family;
  readonly fastMoves: string[];
  readonly level25CP?: number;
  readonly released: boolean;
  readonly speciesId: string;
  readonly speciesName: string;
  readonly tags?: Tag[];
  readonly thirdMoveCost?: boolean | number;
  readonly types: [PokemonType, PokemonTypeOrNone];
  readonly eliteMoves?: string[];
  readonly searchPriority?: number;
  readonly nicknames?: string[];
  readonly legacyMoves?: string[];
  readonly levelFloor?: number;
  readonly aliasId?: string;
  readonly originalFormId?: string;
  readonly formChange?: FormChange;
}

export interface BaseStats {
  readonly atk: number;
  readonly def: number;
  readonly hp: number;
}

export interface Family {
  readonly evolutions?: string[];
  readonly id: string;
  readonly parent?: string;
}

export interface FormChange {
  readonly alternativeFormId: string;
  readonly defaultFormId: string;
  readonly moveId: string;
  readonly trigger: string;
  readonly type: string;
}

export const Tag = {
  Alolan: "alolan",
  Duplicate: "duplicate",
  Duplicate1500: "duplicate1500",
  Galarian: "galarian",
  Hisuian: "hisuian",
  Include1500: "include1500",
  Include2500: "include2500",
  Legendary: "legendary",
  Mega: "mega",
  Mythical: "mythical",
  Paldean: "paldean",
  Regional: "regional",
  Shadow: "shadow",
  Shadoweligible: "shadoweligible",
  Starter: "starter",
  Teambuilderexclude: "teambuilderexclude",
  Ultrabeast: "ultrabeast",
  Untradeable: "untradeable",
  Wildlegendary: "wildlegendary",
  Xs: "xs",
} as const;

export type Tag = (typeof Tag)[keyof typeof Tag];

export interface PokemonRegion {
  readonly dexEnd: number;
  readonly dexStart: number;
  readonly name: string;
  readonly string: string;
}

export interface PokemonTraits {
  readonly cons: string[];
  readonly pros: string[];
}

export interface RankingScenario {
  readonly energy: number[];
  readonly shields: number[];
  readonly slug: string;
}

export interface Settings {
  readonly buffDivisor: number;
  readonly maxBuffStages: number;
  readonly partySize: number;
  readonly shadowAtkMult: number;
  readonly shadowDefMult: number;
}
