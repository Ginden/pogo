import {readFile} from "node:fs/promises";
import path from "node:path";
import cpms from "./cpm.json" with {type: "json"};
import {
  BuffTarget as PrismaBuffTarget,
  MoveCategory,
  PokemonTag as PrismaPokemonTag,
  PokemonType as PrismaPokemonType,
  PrismaClient,
  Prisma,
} from "./generated/prisma/client.mts";
import {Pool} from "pg";
import {PrismaPg} from "@prisma/adapter-pg";
import {
  BuffTarget,
  PokemonType,
  PokemonTypeOrNone,
  Tag,
} from "./gamemaster.json.types.mts";
import {z} from "zod";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({connectionString: databaseUrl});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({adapter});

const pokemonTypeEnum = z.enum(
  Object.values(PokemonType) as [PokemonType, ...PokemonType[]],
);

const pokemonTypeOrNoneEnum = z.enum(
  Object.values(PokemonTypeOrNone) as [
    PokemonTypeOrNone,
    ...PokemonTypeOrNone[]
  ],
);

const tagEnum = z.enum(Object.values(Tag) as [Tag, ...Tag[]]);
const buffTargetEnum = z.enum(
  Object.values(BuffTarget) as [BuffTarget, ...BuffTarget[]],
);

const moveSchema = z.object({
  abbreviation: z.string().optional(),
  archetype: z.string().optional(),
  cooldown: z.number(),
  energy: z.number(),
  energyGain: z.number(),
  moveId: z.string(),
  name: z.string(),
  power: z.number(),
  turns: z.number().optional(),
  type: pokemonTypeEnum,
  buffApplyChance: z.string().optional(),
  buffTarget: buffTargetEnum.optional(),
  buffs: z.array(z.number()).optional(),
  buffsOpponent: z.array(z.number()).optional(),
  buffsSelf: z.array(z.number()).optional(),
});

const defaultIvSchema = z.tuple([
  z.number(),
  z.number(),
  z.number(),
  z.number(),
]);

const familySchema = z
  .object({
    id: z.string(),
    parent: z.string().optional(),
    evolutions: z.array(z.string()).optional(),
  })
  .optional();

const pokemonSchema = z.object({
  speciesId: z.string(),
  speciesName: z.string(),
  dex: z.number(),
  baseStats: z.object({atk: z.number(), def: z.number(), hp: z.number()}),
  types: z.tuple([pokemonTypeEnum, pokemonTypeOrNoneEnum]),
  released: z.boolean(),
  buddyDistance: z.number().optional(),
  level25CP: z.number().optional(),
  searchPriority: z.number().optional(),
  thirdMoveCost: z.union([z.boolean(), z.number()]).optional(),
  levelFloor: z.number().optional(),
  aliasId: z.string().optional(),
  originalFormId: z.string().optional(),
  formChange: z.record(z.string(), z.unknown()).optional(),
  defaultIVs: z.record(z.string(), defaultIvSchema),
  family: familySchema,
  fastMoves: z.array(z.string()),
  chargedMoves: z.array(z.string()),
  eliteMoves: z.array(z.string()).optional(),
  legacyMoves: z.array(z.string()).optional(),
  tags: z.array(tagEnum).optional(),
  nicknames: z.array(z.string()).optional(),
});

const regionSchema = z.object({
  dexStart: z.number(),
  dexEnd: z.number(),
  name: z.string(),
  string: z.string(),
});

const gamemasterSchema = z
  .object({
    moves: z.array(moveSchema),
    pokemon: z.array(pokemonSchema),
    pokemonRegions: z.array(regionSchema),
    pokemonTags: z.array(tagEnum),
    shadowPokemon: z.array(z.string()),
  })
  .passthrough();

type ParsedGamemaster = z.infer<typeof gamemasterSchema>;

function toPrimaryType(type: PokemonType): PrismaPokemonType {
  if (type === "none") {
    throw new Error("Primary type cannot be none");
  }

  return type as PrismaPokemonType;
}

function toSecondaryType(
  type: PokemonTypeOrNone,
): PrismaPokemonType | null {
  return type === "none" ? null : (type as PrismaPokemonType);
}

function toBuffTarget(target?: BuffTarget): PrismaBuffTarget | null {
  return target ? (target as PrismaBuffTarget) : null;
}

function isThirdMoveUnlockable(value?: boolean | number): boolean {
  if (value === undefined) {
    return false;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return Number.isFinite(value);
}

function parseBuffApplyChance(value?: string) {
  if (value === undefined) {
    return null;
  }

  const parsed = Number.parseFloat(value);

  return Number.isFinite(parsed) ? parsed : null;
}

async function resetDatabase() {
  await prisma.$transaction([
    prisma.pokemonDefaultIv.deleteMany(),
    prisma.pokemonMove.deleteMany(),
    prisma.pokemonTagLink.deleteMany(),
    prisma.pokemonNickname.deleteMany(),
    prisma.pokemonEvolution.deleteMany(),
    prisma.pokemon.deleteMany(),
    prisma.move.deleteMany(),
    prisma.family.deleteMany(),
    prisma.pokemonRegionDefinition.deleteMany(),
    prisma.cpm.deleteMany(),
  ]);
}

async function seedRegions(gamemaster: ParsedGamemaster) {
  if (gamemaster.pokemonRegions.length === 0) {
    return;
  }

  await prisma.pokemonRegionDefinition.createMany({
    data: gamemaster.pokemonRegions.map((region) => ({
      name: region.name,
      dexStart: region.dexStart,
      dexEnd: region.dexEnd,
      slug: region.string,
    })),
  });
}

async function seedFamilies(gamemaster: ParsedGamemaster) {
  const families = new Map<
    string,
    {id: string; parentSpeciesId: string | null; evolutions: string[]}
  >();

  for (const pokemon of gamemaster.pokemon) {
    const family = pokemon.family;
    if (!family) {
      continue;
    }

    const existing = families.get(family.id) ?? {
      id: family.id,
      parentSpeciesId: null,
      evolutions: [],
    };

    if (!existing.parentSpeciesId && family.parent) {
      existing.parentSpeciesId = family.parent;
    }

    if (family.evolutions) {
      for (const evolution of family.evolutions) {
        if (!existing.evolutions.includes(evolution)) {
          existing.evolutions.push(evolution);
        }
      }
    }

    families.set(family.id, existing);
  }

  if (families.size === 0) {
    return;
  }

  await prisma.family.createMany({data: Array.from(families.values())});
}

async function seedMoves(gamemaster: ParsedGamemaster) {
  await prisma.move.createMany({
    data: gamemaster.moves.map((move) => ({
      moveId: move.moveId,
      name: move.name,
      abbreviation: move.abbreviation ?? null,
      archetype: move.archetype ?? null,
      type: toPrimaryType(move.type),
      cooldownMs: move.cooldown,
      energy: move.energy,
      energyGain: move.energyGain,
      power: move.power,
      turns: move.turns ?? null,
      buffApplyChance: parseBuffApplyChance(move.buffApplyChance),
      buffTarget: toBuffTarget(move.buffTarget),
      buffs: move.buffs ?? [],
      buffsOpponent: move.buffsOpponent ?? [],
      buffsSelf: move.buffsSelf ?? [],
    })),
  });
}

async function seedPokemon(gamemaster: ParsedGamemaster) {
  const shadowEligible = new Set(gamemaster.shadowPokemon);

  await prisma.pokemon.createMany({
    data: gamemaster.pokemon.map((pokemon) => ({
      speciesId: pokemon.speciesId,
      speciesName: pokemon.speciesName,
      dex: pokemon.dex,
      baseAtk: pokemon.baseStats.atk,
      baseDef: pokemon.baseStats.def,
      baseHp: pokemon.baseStats.hp,
      typePrimary: toPrimaryType(pokemon.types[0]!),
      typeSecondary: toSecondaryType(pokemon.types[1]!),
      released: pokemon.released,
      buddyDistance: pokemon.buddyDistance ?? null,
      level25Cp: pokemon.level25CP ?? null,
      searchPriority: pokemon.searchPriority ?? null,
      thirdMoveCost:
        typeof pokemon.thirdMoveCost === "number"
          ? pokemon.thirdMoveCost
          : null,
      thirdMoveUnlockable: isThirdMoveUnlockable(pokemon.thirdMoveCost),
      levelFloor: pokemon.levelFloor ?? null,
      aliasId: pokemon.aliasId ?? null,
      originalFormId: pokemon.originalFormId ?? null,
      familyId: pokemon.family?.id ?? null,
      familyParentSpeciesId: pokemon.family?.parent ?? null,
      formChange:
        (pokemon.formChange as Prisma.InputJsonValue | undefined) ??
        Prisma.DbNull,
      shadowAvailable: shadowEligible.has(pokemon.speciesId),
    })),
  });
}

async function seedEvolutions(gamemaster: ParsedGamemaster) {
  const seenEdges = new Set<string>();
  const evolutions: {
    fromSpeciesId: string;
    toSpeciesId: string;
    familyId: string | null;
  }[] = [];

  for (const pokemon of gamemaster.pokemon) {
    const familyId = pokemon.family?.id ?? null;
    for (const evolution of pokemon.family?.evolutions ?? []) {
      const key = `${pokemon.speciesId}::${evolution}`;
      if (seenEdges.has(key)) {
        continue;
      }

      seenEdges.add(key);
      evolutions.push({
        fromSpeciesId: pokemon.speciesId,
        toSpeciesId: evolution,
        familyId,
      });
    }
  }

  if (evolutions.length === 0) {
    return;
  }

  await prisma.pokemonEvolution.createMany({data: evolutions});
}

async function seedDefaultIvs(gamemaster: ParsedGamemaster) {
  const rows: {
    scenario: string;
    level: number;
    attack: number;
    defense: number;
    stamina: number;
    pokemonId: string;
  }[] = [];

  for (const pokemon of gamemaster.pokemon) {
    for (const [scenario, values] of Object.entries(pokemon.defaultIVs)) {
      if (values.length !== 4) {
        continue;
      }

      const [level, attack, defense, stamina] = values;
      if (
        !Number.isFinite(level) ||
        !Number.isFinite(attack) ||
        !Number.isFinite(defense) ||
        !Number.isFinite(stamina)
      ) {
        continue;
      }

      rows.push({
        scenario,
        level,
        attack,
        defense,
        stamina,
        pokemonId: pokemon.speciesId,
      });
    }
  }

  if (rows.length === 0) {
    return;
  }

  await prisma.pokemonDefaultIv.createMany({data: rows});
}

async function seedTags(gamemaster: ParsedGamemaster) {
  const tags: {pokemonId: string; tag: PrismaPokemonTag}[] = [];
  const seen = new Set<string>();

  for (const pokemon of gamemaster.pokemon) {
    for (const tag of pokemon.tags ?? []) {
      const key = `${pokemon.speciesId}::${tag}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      tags.push({
        pokemonId: pokemon.speciesId,
        tag: tag as PrismaPokemonTag,
      });
    }
  }

  if (tags.length === 0) {
    return;
  }

  await prisma.pokemonTagLink.createMany({data: tags});
}

async function seedNicknames(gamemaster: ParsedGamemaster) {
  const nicknames: {pokemonId: string; nickname: string}[] = [];
  const seen = new Set<string>();

  for (const pokemon of gamemaster.pokemon) {
    for (const nickname of pokemon.nicknames ?? []) {
      const key = `${pokemon.speciesId}::${nickname}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      nicknames.push({pokemonId: pokemon.speciesId, nickname});
    }
  }

  if (nicknames.length === 0) {
    return;
  }

  await prisma.pokemonNickname.createMany({data: nicknames});
}

async function seedPokemonMoves(gamemaster: ParsedGamemaster) {
  const rows: {
    pokemonId: string;
    moveId: string;
    category: MoveCategory;
    isElite: boolean;
    isLegacy: boolean;
  }[] = [];

  for (const pokemon of gamemaster.pokemon) {
    const eliteMoves = new Set(pokemon.eliteMoves ?? []);
    const legacyMoves = new Set(pokemon.legacyMoves ?? []);
    const seen = new Set<string>();

    for (const moveId of pokemon.fastMoves) {
      const key = `${pokemon.speciesId}::${moveId}::fast`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      rows.push({
        pokemonId: pokemon.speciesId,
        moveId,
        category: "fast",
        isElite: eliteMoves.has(moveId),
        isLegacy: legacyMoves.has(moveId),
      });
    }

    for (const moveId of pokemon.chargedMoves) {
      const key = `${pokemon.speciesId}::${moveId}::charged`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      rows.push({
        pokemonId: pokemon.speciesId,
        moveId,
        category: "charged",
        isElite: eliteMoves.has(moveId),
        isLegacy: legacyMoves.has(moveId),
      });
    }
  }

  if (rows.length === 0) {
    return;
  }

  await prisma.pokemonMove.createMany({data: rows});
}

async function seedCpms() {
  await prisma.cpm.createMany({
    data: cpms.map((cpm, index) => {
      const levelRaw = (index + 1) / 2;
      return {
        level: index + 1,
        levelRaw,
        requiresBestBuddyBoost: levelRaw > 50,
        cpm,
      };
    }),
  });
}

async function loadGamemaster(gamemasterPath: string) {
  const resolved = path.resolve(gamemasterPath);
  const content = await readFile(resolved, "utf8");

  return gamemasterSchema.parse(JSON.parse(content));
}

async function main() {
  const gamemasterPath = process.argv[2];
  if (!gamemasterPath) {
    console.error("Usage: node index.mts /path/to/gamemaster.json");
    process.exitCode = 1;
    return;
  }

  const gamemaster = await loadGamemaster(gamemasterPath);

  await resetDatabase();
  await seedRegions(gamemaster);
  await seedFamilies(gamemaster);
  await seedMoves(gamemaster);
  await seedPokemon(gamemaster);
  await seedEvolutions(gamemaster);
  await seedDefaultIvs(gamemaster);
  await seedTags(gamemaster);
  await seedNicknames(gamemaster);
  await seedPokemonMoves(gamemaster);
  await seedCpms();
}

await main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

await prisma.$disconnect();
await pool.end();
