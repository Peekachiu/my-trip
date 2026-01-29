"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGroupBudget = exports.updatePersonalBudget = exports.addExpense = exports.updateTrip = exports.createTrip = exports.getTripById = exports.getTripsForUser = exports.getAllTrips = void 0;
const db_1 = require("../db");
const generateId = () => Math.random().toString(36).substring(2, 9);
const getAllTrips = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [trips] = yield db_1.pool.execute('SELECT * FROM trips');
        res.json(trips);
    }
    catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});
exports.getAllTrips = getAllTrips;
const getTripsForUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.userId;
    try {
        const [trips] = yield db_1.pool.execute(`SELECT t.* FROM trips t 
             JOIN trip_assignments ta ON t.id = ta.trip_id 
             WHERE ta.user_id = ?`, [userId]);
        res.json(trips);
    }
    catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});
exports.getTripsForUser = getTripsForUser;
const getTripById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tripId = req.params.id;
    // Optional query param ?userId=... to contextually load personal budget (not strictly needed if we return all assignments)
    try {
        const [tripRows] = yield db_1.pool.execute('SELECT * FROM trips WHERE id = ?', [tripId]);
        if (tripRows.length === 0)
            return res.status(404).json({ message: 'Trip not found' });
        const trip = tripRows[0];
        // Fetch related data
        const [itinerary] = yield db_1.pool.execute('SELECT * FROM itinerary_items WHERE trip_id = ?', [tripId]);
        // Get all expenses (frontend can filter by type/user or we allow all visibility)
        const [expenses] = yield db_1.pool.execute('SELECT * FROM expenses WHERE trip_id = ?', [tripId]);
        // Get budget assignments
        const [assignments] = yield db_1.pool.execute(`SELECT ta.user_id, ta.personal_budget, u.username 
             FROM trip_assignments ta 
             JOIN users u ON ta.user_id = u.id 
             WHERE ta.trip_id = ?`, [tripId]);
        const [assignedUsers] = yield db_1.pool.execute('SELECT user_id FROM trip_assignments WHERE trip_id = ?', [tripId]);
        trip.itinerary = itinerary;
        trip.expenses = expenses;
        trip.assignments = assignments;
        trip.assignedToIds = assignedUsers.map((u) => u.user_id);
        // Map snake_case DB columns to camelCase for frontend
        trip.startDate = trip.start_date;
        trip.endDate = trip.end_date;
        res.json(trip);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});
exports.getTripById = getTripById;
const createTrip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, destination, startDate, endDate, budget, assignedToIds, itinerary } = req.body;
    const tripId = generateId();
    const start = startDate === '' ? null : startDate;
    const end = endDate === '' ? null : endDate;
    const connection = yield db_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        // 1. Insert Trip (Group Budget)
        yield connection.execute('INSERT INTO trips (id, title, destination, start_date, end_date, budget) VALUES (?, ?, ?, ?, ?, ?)', [tripId, title, destination, start, end, budget]);
        // 2. Insert Assignments
        if (assignedToIds && assignedToIds.length > 0) {
            for (const userId of assignedToIds) {
                // Initialize personal budget to 0
                yield connection.execute('INSERT INTO trip_assignments (trip_id, user_id, personal_budget) VALUES (?, ?, ?)', [tripId, userId, 0]);
            }
        }
        // 3. Insert Itinerary
        if (itinerary && itinerary.length > 0) {
            for (const item of itinerary) {
                yield connection.execute('INSERT INTO itinerary_items (id, trip_id, day, time, date, activity) VALUES (?, ?, ?, ?, ?, ?)', [generateId(), tripId, item.day, item.time, item.date || null, item.activity]);
            }
        }
        yield connection.commit();
        res.status(201).json({ id: tripId, title, destination, startDate: start, endDate: end, budget });
    }
    catch (error) {
        yield connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Failed to create trip' });
    }
    finally {
        connection.release();
    }
});
exports.createTrip = createTrip;
const updateTrip = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tripId = req.params.id;
    const { title, destination, startDate, endDate, budget, itinerary, assignedToIds } = req.body;
    const start = startDate === '' ? null : startDate;
    const end = endDate === '' ? null : endDate;
    const connection = yield db_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        // 1. Update Trip Details
        yield connection.execute('UPDATE trips SET title = ?, destination = ?, start_date = ?, end_date = ?, budget = ? WHERE id = ?', [title, destination, start, end, budget, tripId]);
        // 2. Update Itinerary: Delete all old items and re-insert (Simplest for now)
        yield connection.execute('DELETE FROM itinerary_items WHERE trip_id = ?', [tripId]);
        if (itinerary && itinerary.length > 0) {
            for (const item of itinerary) {
                yield connection.execute('INSERT INTO itinerary_items (id, trip_id, day, time, date, activity) VALUES (?, ?, ?, ?, ?, ?)', [generateId(), tripId, item.day, item.time, item.date || null, item.activity]);
            }
        }
        // 3. Update Assignments
        if (assignedToIds) {
            // Get current assignments
            const [currentAssignments] = yield connection.execute('SELECT user_id FROM trip_assignments WHERE trip_id = ?', [tripId]);
            const currentIds = currentAssignments.map((a) => a.user_id);
            const newIds = assignedToIds;
            // Determine additions and removals
            const toAdd = newIds.filter(id => !currentIds.includes(id));
            const toRemove = currentIds.filter(id => !newIds.includes(id));
            // Add new users with 0 budget
            for (const userId of toAdd) {
                yield connection.execute('INSERT INTO trip_assignments (trip_id, user_id, personal_budget) VALUES (?, ?, ?)', [tripId, userId, 0]);
            }
            // Remove users (and their personal budget)
            if (toRemove.length > 0) {
                // Using IN clause for deletion
                // Construct placeholders based on length
                const placeholders = toRemove.map(() => '?').join(',');
                yield connection.execute(`DELETE FROM trip_assignments WHERE trip_id = ? AND user_id IN (${placeholders})`, [tripId, ...toRemove]);
            }
        }
        yield connection.commit();
        res.json({ success: true });
    }
    catch (error) {
        yield connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Failed to update trip' });
    }
    finally {
        connection.release();
    }
});
exports.updateTrip = updateTrip;
const addExpense = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tripId = req.params.id;
    const { amount, category, note, date, type, userId } = req.body; // Expect type & userId
    const expenseId = generateId();
    try {
        yield db_1.pool.execute('INSERT INTO expenses (id, trip_id, user_id, amount, category, note, date, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [expenseId, tripId, userId, amount, category, note, date, type || 'individual']);
        res.status(201).json({ id: expenseId, tripId, userId, amount, category, note, date, type });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add expense' });
    }
});
exports.addExpense = addExpense;
const updatePersonalBudget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tripId = req.params.id;
    const { userId, budget } = req.body;
    try {
        yield db_1.pool.execute('UPDATE trip_assignments SET personal_budget = ? WHERE trip_id = ? AND user_id = ?', [budget, tripId, userId]);
        res.json({ success: true, budget });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update personal budget' });
    }
});
exports.updatePersonalBudget = updatePersonalBudget;
const updateGroupBudget = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tripId = req.params.id;
    const { amount, date } = req.body; // Expect amount and date
    if (!amount)
        return res.status(400).json({ error: 'Amount is required' });
    const logDate = date || new Date().toISOString().split('T')[0];
    const connection = yield db_1.pool.getConnection();
    try {
        yield connection.beginTransaction();
        // 1. Log the budget change
        yield connection.execute('INSERT INTO budget_logs (id, trip_id, amount, date) VALUES (?, ?, ?, ?)', [generateId(), tripId, amount, logDate]);
        // 2. Update the main budget total
        yield connection.execute('UPDATE trips SET budget = budget + ? WHERE id = ?', [amount, tripId]);
        yield connection.commit();
        res.json({ success: true, added: amount, date: logDate });
    }
    catch (error) {
        yield connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Failed to update group budget' });
    }
    finally {
        connection.release();
    }
});
exports.updateGroupBudget = updateGroupBudget;
