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

INSERT INTO results (user_id, family_id, workout_id, score, notes)
  VALUES (1, 1, 1, 100, 'Felt great'),
         (1, 2, 1, 100, 'Felt really great'),
         (2, 1, 1, 101, 'So close!!!!'),
         (3, 2, 1, 80, 'So hard!!!!'),
         (1, 1, 2, 17, 'Not so good today'),
         (1, 2, 2, 17, 'Not good today'),
         (2, 1, 2, 17, 'It''s a tie?!?'),
         (3, 2, 2, 20, 'Pretty fun');

INSERT INTO comments (result_id, user_id, content)
  VALUES (1, 2, 'Sorry I beat you, wish we workout out together today'),
         (1, 1, 'It''s okay, I forgive you'),
         (1, 2, 'Thank you!'),
         (3, 1, 'Proud of you'),
         (3, 2, 'Thank you so much'),
         (4, 1, 'Super duper roud of you'),
         (4, 3, 'Why did you talk me into this??');
