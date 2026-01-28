import { Request, Response } from 'express';
import { pool } from '../db';
import { User } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const getUsers = async (req: Request, res: Response) => {
    try {
        const [rows] = await pool.execute('SELECT id, username, role FROM users');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    const { username, password, role } = req.body;
    const newUser: User = { id: generateId(), username, password, role };

    try {
        await pool.execute(
            'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
            [newUser.id, newUser.username, newUser.password, newUser.role]
        );
        res.status(201).json({ id: newUser.id, username, role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    try {
        const [rows]: any = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND password = ?',
            [username, password]
        );

        if (rows.length > 0) {
            const user = rows[0];
            const { password, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
};
