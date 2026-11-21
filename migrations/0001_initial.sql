-- Tendle's tables, behind the storage ports in src/game/ports.ts.
-- A person writes this folder: migrations/ is human-only, so the factory's
-- agents build on these tables but never change them.

-- One list per day. Its entries are the day's answers, loaded by a person
-- from the private lists repository.
CREATE TABLE lists (
  date TEXT PRIMARY KEY CHECK (date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  title TEXT NOT NULL,
  source_url TEXT NOT NULL
);

-- A list's ten entries. Other names that count too are a JSON array of strings.
CREATE TABLE entries (
  date TEXT NOT NULL REFERENCES lists (date) ON DELETE CASCADE,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
  answer TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(aliases) AND json_type(aliases) = 'array'),
  PRIMARY KEY (date, rank)
);

-- One player's round on one day. A later save for the same player and day
-- replaces it.
CREATE TABLE rounds (
  date TEXT NOT NULL,
  player_id TEXT NOT NULL,
  strikes INTEGER NOT NULL CHECK (strikes BETWEEN 0 AND 3),
  PRIMARY KEY (date, player_id)
);

-- The entries a round found, and in which order (position 1 = found first).
-- Counting how many players found each rank reads this table.
CREATE TABLE round_finds (
  date TEXT NOT NULL,
  player_id TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 10),
  PRIMARY KEY (date, player_id, rank),
  UNIQUE (date, player_id, position),
  FOREIGN KEY (date, player_id) REFERENCES rounds (date, player_id) ON DELETE CASCADE
);
CREATE INDEX round_finds_by_date_and_rank ON round_finds (date, rank);

-- A settled day: how many played, and how many found each rank, as a JSON
-- object from rank to count. A later save for the same day replaces it.
CREATE TABLE day_results (
  date TEXT PRIMARY KEY,
  players INTEGER NOT NULL CHECK (players >= 0),
  finder_counts TEXT NOT NULL CHECK (json_valid(finder_counts) AND json_type(finder_counts) = 'object')
);

-- Each player's final score on a settled day. Its own table, not part of the
-- JSON above: a day can have thousands of players, and a results page needs
-- only one player's score.
CREATE TABLE day_scores (
  date TEXT NOT NULL REFERENCES day_results (date) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  PRIMARY KEY (date, player_id)
);
