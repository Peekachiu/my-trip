import { pool } from '../db';

const migrate = async () => {
    try {
        console.log('Migrating expenses table...');
        const connection = await pool.getConnection();

        try {
            try {
                await connection.execute('ALTER TABLE expenses ADD COLUMN type VARCHAR(20) DEFAULT "individual"');
                console.log('Added type column');
            } catch (e: any) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log('type column already exists');
                } else {
                    console.error('Error adding type column:', e);
                }
            }

            try {
                await connection.execute('ALTER TABLE expenses ADD COLUMN user_id VARCHAR(255)');
                console.log('Added user_id column');
            } catch (e: any) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log('user_id column already exists');
                } else {
                    console.error('Error adding user_id column:', e);
                }
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
