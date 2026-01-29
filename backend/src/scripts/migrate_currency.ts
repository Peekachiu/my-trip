import { pool } from '../db';

const migrate = async () => {
    try {
        console.log('Migrating currency columns...');
        const connection = await pool.getConnection();

        try {
            // Trips Table
            try {
                await connection.execute('ALTER TABLE trips ADD COLUMN base_currency VARCHAR(3) DEFAULT "USD"');
                console.log('Added base_currency to trips');
            } catch (e: any) {
                if (e.code === 'ER_DUP_FIELDNAME') console.log('base_currency already exists in trips');
                else console.error('Error adding base_currency:', e);
            }

            // Expenses Table
            try {
                await connection.execute('ALTER TABLE expenses ADD COLUMN currency VARCHAR(3) DEFAULT "USD"');
                console.log('Added currency to expenses');
            } catch (e: any) {
                if (e.code === 'ER_DUP_FIELDNAME') console.log('currency already exists in expenses');
                else console.error('Error adding currency:', e);
            }

            try {
                await connection.execute('ALTER TABLE expenses ADD COLUMN exchange_rate DECIMAL(10, 4) DEFAULT 1.0000');
                console.log('Added exchange_rate to expenses');
            } catch (e: any) {
                if (e.code === 'ER_DUP_FIELDNAME') console.log('exchange_rate already exists in expenses');
                else console.error('Error adding exchange_rate:', e);
            }

        } finally {
            connection.release();
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
