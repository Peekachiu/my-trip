import { Request, Response } from 'express';
import { pool } from '../db';
import { Trip, Expense, ItineraryItem } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

export const getAllTrips = async (req: Request, res: Response) => {
    try {
        const [trips]: any = await pool.execute('SELECT * FROM trips');
        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
};

export const getTripsForUser = async (req: Request, res: Response) => {
    const userId = req.params.userId;
    try {
        const [trips]: any = await pool.execute(
            `SELECT t.* FROM trips t 
             JOIN trip_assignments ta ON t.id = ta.trip_id 
             WHERE ta.user_id = ?`,
            [userId]
        );
        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
};

export const getTripById = async (req: Request, res: Response) => {
    const tripId = req.params.id;
    // Optional query param ?userId=... to contextually load personal budget (not strictly needed if we return all assignments)

    try {
        const [tripRows]: any = await pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
        if (tripRows.length === 0) return res.status(404).json({ message: 'Trip not found' });

        const trip = tripRows[0];

        // Fetch related data
        const [itinerary]: any = await pool.execute('SELECT * FROM itinerary_items WHERE trip_id = ?', [tripId]);
        // Get all expenses (frontend can filter by type/user or we allow all visibility)
        const [expenses]: any = await pool.execute('SELECT * FROM expenses WHERE trip_id = ?', [tripId]);
        // Get budget assignments
        const [assignments]: any = await pool.execute('SELECT user_id, personal_budget FROM trip_assignments WHERE trip_id = ?', [tripId]);
        const [assignedUsers]: any = await pool.execute('SELECT user_id FROM trip_assignments WHERE trip_id = ?', [tripId]);

        trip.itinerary = itinerary;
        trip.expenses = expenses;
        trip.assignments = assignments;
        trip.assignedToIds = assignedUsers.map((u: any) => u.user_id);

        res.json(trip);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
};

export const createTrip = async (req: Request, res: Response) => {
    const { title, destination, startDate, endDate, budget, assignedToIds, itinerary } = req.body;
    const tripId = generateId();

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert Trip (Group Budget)
        await connection.execute(
            'INSERT INTO trips (id, title, destination, start_date, end_date, budget) VALUES (?, ?, ?, ?, ?, ?)',
            [tripId, title, destination, startDate, endDate, budget]
        );

        // 2. Insert Assignments
        if (assignedToIds && assignedToIds.length > 0) {
            for (const userId of assignedToIds) {
                // Initialize personal budget to 0
                await connection.execute(
                    'INSERT INTO trip_assignments (trip_id, user_id, personal_budget) VALUES (?, ?, ?)',
                    [tripId, userId, 0]
                );
            }
        }

        // 3. Insert Itinerary
        if (itinerary && itinerary.length > 0) {
            for (const item of itinerary) {
                await connection.execute(
                    'INSERT INTO itinerary_items (id, trip_id, day, time, activity) VALUES (?, ?, ?, ?, ?)',
                    [generateId(), tripId, item.day, item.time, item.activity]
                );
            }
        }

        await connection.commit();
        res.status(201).json({ id: tripId, title, destination, startDate, endDate, budget });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Failed to create trip' });
    } finally {
        connection.release();
    }
};

export const addExpense = async (req: Request, res: Response) => {
    const tripId = req.params.id;
    const { amount, category, note, date, type, userId } = req.body; // Expect type & userId
    const expenseId = generateId();

    try {
        await pool.execute(
            'INSERT INTO expenses (id, trip_id, user_id, amount, category, note, date, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [expenseId, tripId, userId, amount, category, note, date, type || 'individual']
        );
        res.status(201).json({ id: expenseId, tripId, userId, amount, category, note, date, type });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add expense' });
    }
};

export const updatePersonalBudget = async (req: Request, res: Response) => {
    const tripId = req.params.id;
    const { userId, budget } = req.body;

    try {
        await pool.execute(
            'UPDATE trip_assignments SET personal_budget = ? WHERE trip_id = ? AND user_id = ?',
            [budget, tripId, userId]
        );
        res.json({ success: true, budget });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update personal budget' });
    }
};
