import { getGameMaster } from "../get-gamemaster";
import { RocketFinderOptions } from "../rocket-finder";

export async function getPokemon({
  excludedSpecies,
  excludeUnreleased,
  excludedTags,
}: Pick<
  RocketFinderOptions,
  "excludedSpecies" | "excludeUnreleased" | "excludedTags"
>) {
  const { pokemon: pokemonRaw } = await getGameMaster();

  return pokemonRaw
    .filter((p) => (excludeUnreleased ? p.released : true))
    .filter((p) => !excludedSpecies.has(p.speciesId))
    .filter(({ tags }) => {
      if (!tags?.length) {
        return true;
      }
      return new Set(tags).isDisjointFrom(excludedTags);
    });
}
