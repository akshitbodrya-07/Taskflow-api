import { z } from "zod";
import { partial } from "zod/mini";

export const createProjectSchema = z.object({
    name: z.string().trim().min(1, "name is required").max(100),
    description: z.string().max(500).optional(),
    ownerId: z.number().int().positive(),
});

export const createTaskSchema = z.object({
    title: z.string().trim().min(1, "title is required").max(200),
    description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "done"]).optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    due_date: z.string().optional(),
    assignee_id: z.number().int().positive().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateProjectSchema = createProjectSchema.partial();

export const registerSchema = z.object({
    name: z.string().trim().min(1, "name is required").max(100),
    email: z.string().trim().email("invalid email address"),
    password: z.string().min(8, "password must be at least 8 character"),
});

export const loginSchema = z.object({
    email: z.string().trim().email("invalid email address"),
    password: z.string().min(1),
});