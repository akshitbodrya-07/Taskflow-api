import express from "express";
import { pool } from "./db";
import { createProjectSchema, createTaskSchema, updateTaskSchema, updateProjectSchema, registerSchema, loginSchema } from "./schemas";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const app = express();
const PORT = 3000;

const JWT_SECRET = process.env.JWT_SECRET;

if(!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set in environment variables");
}

const authentication = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({error: "no token provided"})
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded as {userId: number};
        next();
    } catch(err) {
        return res.status(401).json({error: "invalid expire token"});
    }
};

const checkProjectOwner = async (projectId: number, userId: number) => {
    const existingProject = await pool.query("SELECT * FROM projects WHERE id = $1",[projectId]);
     
    if(existingProject.rows.length == 0) {
        return "not_found"
    }

    if(existingProject.rows[0].owner_id !== userId) {
        return "forbidden"
    }

    return "ok"
};

app.use(express.json()); // middleware: parse JSON request bodies

app.get("/", (req, res) => {
    res.status(200).json({status: "taskflow-API"});
});

app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});

app.get("/projects", authentication, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM projects ORDER BY id");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"});
    }
});

app.get("/projects/:id", authentication, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
        if (result.rows.length == 0) {
            return res.status(404).json({error: "Project not found"});
        }
        res.json(result.rows[0]); 
    } catch (err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"});
    }
});

app.get("/tasks", authentication, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tasks ORDER BY id");
        res.json(result.rows);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"});
    }
});

app.post("/projects", authentication, async (req, res) => {
    try {
        const parsed = createProjectSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
        }

        const { name, description, ownerId } = parsed.data;

        const result = await pool.query(
            "INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *",
            [name, description, ownerId]
        );
        res.status(201).json(result.rows[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"});
    }
});

app.get("/projects/:id/tasks", authentication, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM tasks WHERE project_id = $1",[id]);
        res.json(result.rows);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"});
    }
});

app.post("/projects/:id/tasks", authentication, async (req, res) => {
    try {
        const projectId = Number(req.params.id);
        const projectResult = await pool.query("SELECT * FROM projects WHERE id = $1",[projectId]);

        if (projectResult.rows.length == 0) {
            return res.status(404).json({error: "project not found"});
        }

        const result = createTaskSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({error: result.error.flatten()});
        }

        const { title, description, status, priority, due_date, assignee_id } = result.data;

        const insertResult = await pool.query(
            `INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [projectId, title, description ?? null, status ?? "todo", priority ?? "medium", due_date ?? null, assignee_id ?? null]
        );

        res.status(201).json(insertResult.rows[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }  
});

app.patch("/tasks/:id", authentication, async (req, res) => {
    try {
        const taskID = Number(req.params.id);
        const existingTask = await pool.query("SELECT * FROM tasks WHERE id = $1",[taskID]);

        if(existingTask.rows.length == 0) {
            return res.status(404).json({error: "task not found"});
        }

        const result = updateTaskSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({error: result.error.flatten()});
        }

        const existing = existingTask.rows[0];

        const updatedFields = {
            title: result.data.title ?? existing.title,
            description: result.data.description ?? existing.description,
            status: result.data.status ?? existing.status,
            priority: result.data.priority ?? existing.priority,
            due_date: result.data.due_date ?? existing.due_date,
            assignee_id: result.data.assignee_id ?? existing.assignee_id,
        };
        
        const updateResult = await pool.query(
            `UPDATE tasks
            SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, assignee_id = $6
            WHERE id = $7
            RETURNING *`,
            [
                updatedFields.title,
                updatedFields.description,
                updatedFields.status,
                updatedFields.priority,
                updatedFields.due_date,
                updatedFields.assignee_id,
                taskID,
            ]
        );
        res.status(200).json(updateResult.rows[0]);
    } catch(err){
        console.log(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.delete("/tasks/:id", authentication, async (req, res) => {
    try {
        const taskID = Number(req.params.id);
        const existingTask = await pool.query("SELECT * FROM tasks WHERE id = $1",[taskID]);

        if(existingTask.rows.length == 0) {
            return res.status(404).json({error: "task not found"});
        }

        const deletedTask = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *",[taskID]);
        res.status(200).json({message: "task deleted", task: deletedTask.rows[0]});

    } catch(err) {
        console.log(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.patch("/projects/:id", authentication, async (req, res) => {
    try {
        const projectID = Number(req.params.id);
        const existingProject = await pool.query("SELECT * FROM projects WHERE id = $1",[projectID]);

        if(existingProject.rows.length == 0) {
            return res.status(404).json({error: "project not found"});
        }

        const result = updateProjectSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({error: result.error.flatten()});
        }

        const existing = existingProject.rows[0];

        const updatedFields = {
            name: result.data.name ?? existing.name,
            description: result.data.description ?? existing.description,
            ownerId: result.data.ownerId ?? existing.owner_id,
        };

        const updateResult = await pool.query(
            `UPDATE projects
            SET name = $1, description = $2, owner_id = $3
            WHERE id = $4
            RETURNING *`,
            [
                updatedFields.name,
                updatedFields.description,
                updatedFields.ownerId,
                projectID,
            ]
        );
        res.status(200).json(updateResult.rows[0]);
    } catch(err) {
        console.log(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.delete("/projects/:id", authentication, async (req, res) => {
    try {
        const projectID = Number(req.params.id);
        const existingProject = await pool.query("SELECT * FROM projects Where id = $1", [projectID]);

        if(existingProject.rows.length==0) {
            return res.status(404).json({error: "project not found"});
        }

        const deletedProject = await pool.query ("DELETE FROM projects WHERE id = $1 RETURNING *", [projectID]);
        res.status(200).json({message: "project deleted", project: deletedProject.rows[0]});

    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"})
    }
});

app.get("/tasks/:id", authentication, async (req, res) => {
    try {
        const {id} = req.params;
        const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);

        if(result.rows.length == 0) {
            return res.status(404).json({error: "task not found"});
        }
        
        res.json(result.rows[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"});
    }
});

app.post("/auth/register", async (req, res) => {
    try {
        const result = registerSchema.safeParse(req.body);

        if(!result.success) {
            return res.status(400).json({error: result.error.flatten()});
        }

        const {name, email, password} = result.data;

        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (existingUser.rows.length > 0) {
            return res.status(409).json({error: "email already registered"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertResult = await pool.query("INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *", [name, email, hashedPassword]);

        const newUser = insertResult.rows[0];
        res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            created_at: newUser.created_at,
        });

    } catch(err) {
        console.error(err);
        return res.status(500).json({error: "Something went wrong"});
    }
});

app.post("/auth/login", async (req, res) => {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({error: result.error.flatten()});
        }

        const {email, password} = result.data;

        const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (existingUser.rows.length == 0) {
            return res.status(401).json({error: "invalid email or password"});
        }

        const user = existingUser.rows[0];

        const verifyPassword = await bcrypt.compare(password, user.password_hash)

        if (!verifyPassword) {
            return res.status(401).json({error: "invalid email or password"})
        } else {
            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
            res.status(200).json({ token })
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Something went wrong"})
    }
});

