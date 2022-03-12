--password for all is "password"
  INSERT INTO users (email, user_password, first_name, last_name, is_admin)
    VALUES ('christen@mail.com', '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q', 'Christen', 'McCool', true),
           ('clay@mail.com', '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q', 'Clay', 'Braden', false),
           ('cami@mail.com', '$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q', 'Cami', 'Cortney', false);
  
  INSERT INTO families (family_name)
    VALUES ('mcbragren'),
           ('workteam');
  
  INSERT INTO users_families (user_id, family_id, primary_family)
    VALUES (1,1, true),
           (2,1, true),
           (1,2, false),
           (3,2, true);
  
  
  -- INSERT INTO results (user_id, family_id, workout_id, score, notes)
  --   VALUES (1, 1, 1, 100, 'Felt great'),
  --          (1, 2, 1, 100, 'Felt really great'),
  --          (2, 1, 1, 101, 'So close!!!!'),
  --          (3, 2, 1, 80, 'So hard!!!!'),
  --          (1, 1, 2, 17, 'Not so good today'),
  --          (1, 2, 2, 17, 'Not good today'),
  --          (2, 1, 2, 17, 'It''s a tie?!?'),
  --          (3, 2, 2, 20, 'Pretty fun');
  
  -- INSERT INTO comments (result_id, user_id, content)
  --   VALUES (1, 2, 'Sorry I beat you, wish we workout out together today'),
  --          (1, 1, 'It''s okay, I forgive you'),
  --          (1, 2, 'Thank you!'),
  --          (3, 1, 'Proud of you'),
  --          (3, 2, 'Thank you so much'),
  --          (4, 1, 'Super duper proud of you'),
  --          (4, 3, 'Why did you talk me into this??');
  