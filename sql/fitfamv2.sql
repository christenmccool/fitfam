DROP DATABASE fitfamv2;
CREATE DATABASE fitfamv2;
\connect fitfamv2

\i fitfamv2-schema.sql
\i fitfamv2-workoutseed.sql
\i fitfamv2-seed.sql


DROP DATABASE fitfamv2_test;
CREATE DATABASE fitfamv2_test;
\connect fitfamv2_test

\i fitfamv2-schema.sql
\i fitfamv2-workoutseed.sql
