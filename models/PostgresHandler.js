import csv from 'csv-parser';
import axios from 'axios';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

export const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

export const postgresHandler = async (url) => {
    const results = [];
    
    try {
        // --- INSERT THE NEW LOGIC HERE ---
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS river_data (
            id SERIAL PRIMARY KEY,
            time TIMESTAMPTZ,
            val FLOAT,
            feature TEXT
          );
        `;
        await pool.query(createTableQuery);
        console.log("Verified table 'river_data' exists.");
        // ---------------------------------

        // Request the file as a stream
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            response.data
                .pipe(csv())
                .on('data', (data) => {

                    const rawValue = data.Value ? data.Value.trim() : "";

                    const filteredData = {
                        timestamp: data.Timestamp,
                        value: rawValue === "" ? null : rawValue,
                        feature: data.stationparameter_longname
                    };
                    results.push(filteredData);
                })
                .on('end', async () => {
                    try {
                        await pool.query('TRUNCATE TABLE river_data RESTART IDENTITY CASCADE;');
                        console.log("Table cleared for fresh ingestion.");
                        console.log(`Starting database insertion for ${results.length} rows...`);
                        
                        for (const row of results) {
                            // This query now matches the table structure created above
                            const query = 'INSERT INTO river_data(time, val, feature) VALUES($1, $2, $3)';
                            await pool.query(query, [row.timestamp, row.value, row.feature]);
                        }
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                })
                .on('error', (err) => reject(err));
        });
    } catch (error) {
        console.error("Error fetching the CSV:", error);
        throw error;
    }
};