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
  is_admin boolean DEFAULT false,
  user_status curr_status DEFAULT 'active' NOT NULL,
  image_url text,
  bio text,
  create_date timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamp
);

CREATE TABLE families (
  id serial PRIMARY KEY,
  family_name text NOT NULL,
  image_url text,
  bio text,
  create_date timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamp
);

CREATE TABLE users_families (
  user_id integer REFERENCES users ON DELETE CASCADE,
  family_id integer REFERENCES families ON DELETE CASCADE,
  mem_status curr_status NOT NULL DEFAULT 'active',
  is_admin boolean DEFAULT false,
  primary_family boolean DEFAULT false,
  create_date timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamp,
  PRIMARY KEY (user_id, family_id)
);

CREATE TABLE workouts (
  id serial PRIMARY KEY,
  sw_id text,
  wo_name text,
  wo_description text,
  category text DEFAULT 'custom',
  score_type text,
  create_date timestamp DEFAULT CURRENT_TIMESTAMP,
  modify_date timestamp,
  featured_date timestamp,
  create_by integer REFERENCES users ON DELETE CASCADE
);   

CREATE TABLE postings (
  id serial PRIMARY KEY,
  family_id integer REFERENCES families ON DELETE CASCADE,
  wo_id integer REFERENCES workouts ON DELETE CASCADE,
  create_date timestamp DEFAULT CURRENT_TIMESTAMP,
  modify_date timestamp,
  post_date timestamp DEFAULT CURRENT_TIMESTAMP,
  post_by integer REFERENCES users ON DELETE CASCADE
);   

CREATE TABLE results (
  id serial PRIMARY KEY,
  post_id integer NOT NULL REFERENCES postings ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
  score integer,
  notes text,
  create_date timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamp,
  complete_date timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
  id serial PRIMARY KEY,
  result_id integer NOT NULL REFERENCES results ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users ON DELETE CASCADE,
  content text NOT NULL,
  create_date timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  modify_date timestamp
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
