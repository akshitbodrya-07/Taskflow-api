INSERT INTO users (name, email, password_hash) VALUES
('Akshit', 'akshit@example.com', 'fake_hash_1'),
('Priya', 'priya@example.com', 'fake_hash_2'),
('Anne', 'anne@example.com', 'fake_hash_3');

INSERT INTO projects (name, description, owner_id) VALUES
('Website Redesign', 'Redesign the company website', 1),
('Mobile App', 'Build the first version of the app', 2);

INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 1, 'owner'),
(1, 2, 'member'),
(1, 3, 'admin'),
(2, 2, 'owner'),
(2, 1, 'member');

INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id) VALUES
('Design homepage', 'Create wireframes', 'in_progress', 'high', '2026-10-05', 1, 1),
('Write copy', 'Draft page text', 'todo', 'medium', '2026-10-10', 1, 2),
('Set up CI', 'Configure the pipeline', 'todo', 'low', NULL, 2, NULL),
('Build login screen', 'Login UI', 'done', 'high', '2026-09-30', 2, 1);

INSERT INTO comments (body, task_id, author_id) VALUES
('Started on wireframes.', 1, 1),
('Looks good, need a mobile version too.', 1, 3),
('Blocked on brand guidelines.', 2, 2);