SELECT * FROM tasks;

SELECT title, status FROM tasks 
WHERE status = 'todo'
ORDER BY title;

SELECT title FROM tasks
WHERE due_date IS NULL;

SELECT t.title, p.name AS project, u.name AS assignee
FROM tasks t
JOIN projects p ON p.id = t.project_id
LEFT JOIN users u ON u.id = t.assignee_id
ORDER BY t.id;

SELECT p.name AS project, u.name AS owner
FROM projects p
JOIN users u ON u.id = p.owner_id; 