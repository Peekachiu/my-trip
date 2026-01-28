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
    try {
        const [tripRows]: any = await pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
        if (tripRows.length === 0) return res.status(404).json({ message: 'Trip not found' });

        const trip = tripRows[0];

        // Fetch related data
        const [itinerary]: any = await pool.execute('SELECT * FROM itinerary_items WHERE trip_id = ?', [tripId]);
        const [expenses]: any = await pool.execute('SELECT * FROM expenses WHERE trip_id = ?', [tripId]);
        const [assignedUsers]: any = await pool.execute('SELECT user_id FROM trip_assignments WHERE trip_id = ?', [tripId]);

        trip.itinerary = itinerary;
        trip.expenses = expenses;
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

        // 1. Insert Trip
        await connection.execute(
            'INSERT INTO trips (id, title, destination, start_date, end_date, budget) VALUES (?, ?, ?, ?, ?, ?)',
            [tripId, title, destination, startDate, endDate, budget]
        );

        // 2. Insert Assignments
        if (assignedToIds && assignedToIds.length > 0) {
            for (const userId of assignedToIds) {
                await connection.execute(
                    'INSERT INTO trip_assignments (trip_id, user_id) VALUES (?, ?)',
                    [tripId, userId]
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
    const { amount, category, note, date } = req.body;
    const expenseId = generateId();

    try {
        await pool.execute(
            'INSERT INTO expenses (id, trip_id, amount, category, note, date) VALUES (?, ?, ?, ?, ?, ?)',
            [expenseId, tripId, amount, category, note, date]
        );
        res.status(201).json({ id: expenseId, tripId, amount, category, note, date });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add expense' });
    }
};
