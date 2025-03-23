CREATE TABLE pokemon_move (
    move_id VARCHAR NOT NULL REFERENCES moves(move_id),
    species_id VARCHAR NOT NULL REFERENCES pokemon(species_id),
    is_elite_move BOOLEAN NOT NULL,
    is_legacy_move BOOLEAN NOT NULL,
    PRIMARY KEY (move_id, species_id)
)
