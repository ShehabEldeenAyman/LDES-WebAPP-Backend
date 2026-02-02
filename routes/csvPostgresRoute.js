import { pool } from '../models/PostgresHandler.js';
export const csvPostgresRoute = async (featureName, startDate, endDate, limit, offset) => {
    const query = `
        SELECT time, val, feature 
        FROM river_data 
        WHERE feature = $1 
        AND time >= $2 
        AND time <= $3
        ORDER BY time ASC
        LIMIT $4 OFFSET $5
    `;
    const values = [featureName, startDate, endDate, limit, offset];
    const result = await pool.query(query, values);
    return result.rows;
};