-- Add lovethmombasa@gmail.com as an admin user
INSERT INTO admin_users (email, password_hash, is_super_admin)
VALUES ('lovethmombasa@gmail.com', 'password_to_be_changed_on_first_login', true)
ON CONFLICT (email) DO NOTHING;