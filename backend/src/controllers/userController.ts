import { Request, Response } from 'express';
import { db } from '../store';
import { User } from '../types';
// Helper for simple ID generation if uuid is overkill for now
const generateId = () => Math.random().toString(36).substr(2, 9);

export const getUsers = (req: Request, res: Response) => {
    // Return users without passwords
    const safeUsers = db.users.map(({ password, ...user }) => user);
    res.json(safeUsers);
};

export const createUser = (req: Request, res: Response) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Missing fields' });
    }

    const newUser: User = {
        id: generateId(),
        username,
        password,
        role
    };

    db.users.push(newUser);
    res.status(201).json({ id: newUser.id, username, role });
};

export const loginUser = (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username && u.password === password);

    if (user) {
        const { password, ...safeUser } = user;
        res.json(safeUser);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
};
