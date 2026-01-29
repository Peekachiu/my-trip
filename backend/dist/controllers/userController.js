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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.loginUser = exports.createUser = exports.getUsers = void 0;
const db_1 = require("../db");
const generateId = () => Math.random().toString(36).substring(2, 9);
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [rows] = yield db_1.pool.execute('SELECT id, username, role FROM users');
        res.json(rows);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Database error' });
    }
});
exports.getUsers = getUsers;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password, role } = req.body;
    const newUser = { id: generateId(), username, email, password, role };
    try {
        yield db_1.pool.execute('INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)', [newUser.id, newUser.username, newUser.email, newUser.password, newUser.role]);
        res.status(201).json({ id: newUser.id, username, email, role });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
exports.createUser = createUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    try {
        const [rows] = yield db_1.pool.execute('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            const user = rows[0];
            const { password } = user, userWithoutPassword = __rest(user, ["password"]);
            res.json(userWithoutPassword);
        }
        else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});
exports.loginUser = loginUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.params.id;
    try {
        yield db_1.pool.execute('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
exports.deleteUser = deleteUser;
