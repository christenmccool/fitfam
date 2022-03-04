CREATE TYPE curr_status AS ENUM (
  'active',
  'pending',
  'blocked',
  'inactive'
);

CREATE TABLE users (
  id serial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  user_password text, 
  first_name text NOT NULL,
  last_name text NOT NULL,
  user_status curr_status DEFAULT 'active' NOT NULL,
  image_url text,
  bio text,
  create_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamptz
);

CREATE TABLE families (
  id serial PRIMARY KEY,
  family_name text NOT NULL,
  image_url text,
  bio text,
  create_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamptz
);

CREATE TABLE users_families (
  user_id integer REFERENCES users ON DELETE CASCADE,
  family_id integer REFERENCES families ON DELETE CASCADE,
  mem_status curr_status NOT NULL DEFAULT 'active',
  is_admin boolean DEFAULT false,
  primary_family boolean DEFAULT false,
  create_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamptz,
  PRIMARY KEY (user_id, family_id)
);

CREATE TABLE workouts (
  id serial PRIMARY KEY,
  sw_id text,
  wo_name text,
  wo_description text,
  category text,
  score_type text,
  create_date timestamptz DEFAULT CURRENT_TIMESTAMP,
  modify_date timestamptz, 
  publish_date timestamptz DEFAULT CURRENT_TIMESTAMP
);   

ALTER SEQUENCE workouts_id_seq RESTART WITH 450;

CREATE TABLE results (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
  family_id integer NOT NULL REFERENCES families ON DELETE CASCADE, 
  workout_id integer NOT NULL REFERENCES workouts ON DELETE CASCADE,
  score integer,
  notes text,
  create_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamptz,
  complete_date timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id serial PRIMARY KEY,
  result_id integer NOT NULL REFERENCES results ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
  content text NOT NULL,
  create_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamptz
);

CREATE TABLE movements (
  id text PRIMARY KEY,
  movement_name text NOT NULL,
  youtube_id text
);   

CREATE TABLE workouts_movements (
  wo_id integer REFERENCES workouts ON DELETE CASCADE,
  movement_id text REFERENCES movements ON DELETE CASCADE,
  PRIMARY KEY (wo_id, movement_id)
);   


