DROP TYPE IF EXISTS buff_target;
DROP TYPE IF EXISTS move_type;

CREATE TYPE buff_target AS ENUM ('both', 'self', 'opponent');
CREATE TYPE move_type AS ENUM ('fast', 'charge');

CREATE TABLE moves
(
    abbreviation      VARCHAR,
    name              VARCHAR NOT NULL,
    cooldown          int     NOT NULL,
    energy_cost       int     NOT NULL,
    energy_gain       int     NOT NULL,
    move_id           varchar PRIMARY KEY,
    type              VARCHAR NOT NULL REFERENCES pokemon_types (id),
    buff_target       buff_target,
    buff_apply_chance real,
    buffs             smallint[],
    buffs_opponent    smallint[],
    buffs_self        smallint[],
    move_type         move_type NOT NULL
);

ALTER TABLE MOVES
    ADD CONSTRAINT buff_apply_chance CHECK (buff_apply_chance > 0 AND buff_apply_chance <= 1);

ALTER TABLE moves
    ADD CONSTRAINT correct_buff_length CHECK (array_length(buffs, 1) = 2);

ALTER TABLE moves
    ADD CONSTRAINT correct_buffs_self_length CHECK (array_length(buffs_self, 1) = 2);

ALTER TABLE moves
    ADD CONSTRAINT correct_buffs_opponent_length CHECK (array_length(buffs_opponent, 1) = 2);
