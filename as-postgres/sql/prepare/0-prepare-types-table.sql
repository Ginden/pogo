CREATE TABLE pokemon_types
(
    id      VARCHAR(10) PRIMARY KEY,
    is_real boolean NOT NULL DEFAULT TRUE
) WITH (FILLFACTOR = 100, autovacuum_enabled = false, autovacuum_analyze_threshold = 0);
