CREATE TEMP TABLE workout_import (
  info json
);

COPY workout_import FROM '/Users/christenmccool/Documents/fitfam/sql/workouts.json.csv'
  csv quote e'\x01' delimiter e'\x02';

INSERT INTO workouts 
  SELECT q.* FROM workout_import, json_populate_record(null::workouts, info::json) AS q;


CREATE TEMP TABLE movement_import (
  info json
);

COPY movement_import FROM '/Users/christenmccool/Documents/fitfam/sql/movements.json';

INSERT INTO movements 
  SELECT q.* FROM movement_import, json_populate_record(null::movements, info::json) AS q;

CREATE TEMP TABLE workout_movement_import (
  info json
);

COPY workout_movement_import FROM '/Users/christenmccool/Documents/fitfam/sql/workoutsMovements.json';

INSERT INTO workouts_movements 
  SELECT q.* FROM workout_movement_import, json_populate_record(null::workouts_movements, info::json) AS q;

INSERT INTO users (username, email, first_name, last_name)
  VALUES ('christen', 'christen@mail.com', 'Christen', 'McCool'),
         ('clay', 'clay@mail.com', 'Clay', 'Braden'),
         ('cami', 'cami@mail.com', 'Cami', 'Cortney');

INSERT INTO families (familyname)
  VALUES ('mcbragren'),
         ('workteam');

INSERT INTO users_families (username, family_id)
  VALUES ('christen',1),
         ('clay',1),
         ('christen',2),
         ('cami',2);

-- INSERT INTO results (username, family_id, workout_id, score, notes)
--   VALUES ('christen', 1, 'CsUbCjnosY', 600, 'Tough one'),
--          ('christen', 1, 'xblsnf7IXw', 400, 'Loved'),
--          ('christen', 2, 'xblsnf7IXw', 400, 'Loved'),
--          ('cami', 2, 'xblsnf7IXw', 400, 'Its a tie!'),
--          ('clay', 1, 'CsUbCjnosY', 401, 'I win'),
--          ('clay', 1, 'xblsnf7IXw', 399, 'Ugh');


