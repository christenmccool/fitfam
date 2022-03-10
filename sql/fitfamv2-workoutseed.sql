--import benchmark workouts data into workouts table
CREATE TEMP TABLE workout_import (
  info json
);

COPY workout_import FROM '/Users/christenmccool/Documents/fitfam/sql/workouts.json.csv'
  csv quote e'\x01' delimiter e'\x02';

INSERT INTO workouts (sw_id, wo_name, wo_description, category, score_type)
  SELECT q.sw_id, q.wo_name, q.wo_description, q.category, q.score_type 
  FROM workout_import, json_populate_record(null::workouts, info::json) AS q;
  

--import movement data into movements table
CREATE TEMP TABLE movement_import (
  info json
);

COPY movement_import FROM '/Users/christenmccool/Documents/fitfam/sql/movements.json';

INSERT INTO movements 
  SELECT q.* FROM movement_import, json_populate_record(null::movements, info::json) AS q;


--import data about movements in benchmark workouts into workouts_movements table
CREATE TEMP TABLE workout_movement_import (
  info json
);

COPY workout_movement_import FROM '/Users/christenmccool/Documents/fitfam/sql/workoutsMovements.json';

CREATE TEMP TABLE workouts_movements_temp (
  wo_sw_id text,
  movement_sw_id text
);

INSERT INTO workouts_movements_temp 
  SELECT q.* FROM workout_movement_import, json_populate_record(null::workouts_movements_temp, info::json) AS q;

INSERT INTO workouts_movements (wo_id, movement_id)
  SELECT w.id, wmt.movement_sw_id
  FROM workouts w
  JOIN workouts_movements_temp wmt
  ON w.sw_id = wmt.wo_sw_id;

