import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'trip_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export const query = async (sql: string, params?: any[]) => {
    const [results] = await pool.execute(sql, params);
    return results;
};
