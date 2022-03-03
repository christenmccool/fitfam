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

INSERT INTO users (email, user_password, first_name, last_name)
  VALUES ('christen@mail.com', 'password', 'Christen', 'McCool'),
         ('clay@mail.com', 'password', 'Clay', 'Braden'),
         ('cami@mail.com', 'password', 'Cami', 'Cortney');

INSERT INTO families (family_name)
  VALUES ('mcbragren'),
         ('workteam');

INSERT INTO users_families (user_id, family_id)
  VALUES (1,1),
         (2,1),
         (1,2),
         (3,2);


