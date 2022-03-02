CREATE TYPE curr_status AS ENUM (
  'active',
  'pending',
  'inactive'
);

CREATE TABLE users (
  username text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  user_password text, 
  first_name text NOT NULL,
  last_name text NOT NULL,
  image_url text,
  bio text,
  join_date date DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE families (
  id serial PRIMARY KEY,
  familyname text NOT NULL,
  image_url text,
  bio text,
  creation_date date DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE users_families (
  username text REFERENCES users ON DELETE CASCADE,
  family_id integer REFERENCES families ON DELETE CASCADE,
  family_status curr_status NOT NULL DEFAULT 'active',
  is_admin boolean DEFAULT false,
  primary_family boolean DEFAULT false,
  join_date date DEFAULT CURRENT_DATE NOT NULL,
  PRIMARY KEY (username, family_id)
);

CREATE TABLE workouts (
  id serial PRIMARY KEY,
  sw_id text,
  wo_name text,
  wo_description text,
  category text,
  score_type text,
  wo_date date
);   

ALTER SEQUENCE workouts_id_seq RESTART WITH 450;

CREATE TABLE results (
  id serial PRIMARY KEY,
  username text NOT NULL REFERENCES users ON DELETE CASCADE,
  family_id integer NOT NULL REFERENCES families ON DELETE CASCADE, 
  workout_id integer NOT NULL REFERENCES workouts ON DELETE CASCADE,
  score integer,
  notes text,
  date_completed date DEFAULT CURRENT_DATE NOT NULL
);

CREATE TABLE comments (
  id serial PRIMARY KEY,
  result_id integer NOT NULL REFERENCES results ON DELETE CASCADE,
  username text NOT NULL REFERENCES users ON DELETE CASCADE,
  content text NOT NULL,
  comment_date date DEFAULT CURRENT_DATE NOT NULL
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


