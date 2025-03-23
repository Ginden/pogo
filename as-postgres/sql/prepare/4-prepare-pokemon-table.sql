CREATE TABLE pokemon
(
    base_attack  INT NOT NULL,
    base_defense INT NOT NULL,
    base_hp      INT NOT NULL,
    dex          INT NOT NULL,
    released BOOLEAN NOT NULL,
    species_id VARCHAR PRIMARY KEY,
    evolution_parent VARCHAR REFERENCES pokemon(species_id),
    name varchar NOT NULL,
    type1 VARCHAR NOT NULL REFERENCES pokemon_types (id),
    type2 VARCHAR REFERENCES pokemon_types (id),
    levelFloor INT NOT NULL
)


