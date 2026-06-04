-- Mark accounts created via super-admin "fake user" registration (test / demo).
ALTER TABLE `users` ADD COLUMN `is_fake_user` BOOLEAN NOT NULL DEFAULT false;
