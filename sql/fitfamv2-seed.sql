--password for all is "password"
  INSERT INTO users (email, user_password, first_name, last_name, is_admin)
    VALUES ('christen@mail.com', '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q', 'Christen', 'McCool', true),
           ('clay@mail.com', '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q', 'Clay', 'Braden', false),
           ('cami@mail.com', '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q', 'Cami', 'Cortney', false),
           ('jack@mail.com', '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q', 'Jack', 'McCool', false);

  INSERT INTO families (family_name, join_code)
    VALUES ('teamfitfam', '123456789'),
           ('mcbragren', 'abcd1234'),
           ('workteam', 'lmno1234');
  
  INSERT INTO users_families (user_id, family_id, primary_family)
    VALUES (1, 1, false),
           (2, 1, false),
           (3, 1, false),
           (4, 1, true),
           (1, 2, true),
           (1, 3, false),
           (2, 2, true),
           (3, 3, true);
  
