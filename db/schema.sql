DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     name VARCHAR(100) NOT NULL,
     email VARCHAR(255) NOT NULL UNIQUE,
     password_hash TEXT NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

CREATE TABLE projects (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     name VARCHAR(100) NOT NULL,
     description VARCHAR(500),
     owner_id INTEGER NOT NULL REFERENCES users(id),
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

CREATE TABLE project_members (
     project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
     user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     role VARCHAR(20) NOT NULL DEFAULT 'member'
       CHECK (role IN ('owner', 'admin', 'member')),
     joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     PRIMARY KEY (project_id, user_id)
   );

CREATE TABLE tasks (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     title VARCHAR(200) NOT NULL,
     description TEXT,
     status VARCHAR(20) NOT NULL DEFAULT 'todo'
       CHECK (status IN ('todo', 'in_progress', 'done')),
     priority VARCHAR(10) NOT NULL DEFAULT 'medium'
       CHECK (priority IN ('low', 'medium', 'high')),
     due_date DATE,
     project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
     assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

CREATE TABLE comments (
     id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
     body TEXT NOT NULL,
     task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
     author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );