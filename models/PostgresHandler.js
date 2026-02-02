import csv from 'csv-parser';
import axios from 'axios';
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

export const postgresHandler = async (url) => {
    const results = [];
    
    try {
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
                    // FILTER SPECIFIC ATTRIBUTES HERE
                    // Based on your use case, selecting specific river data:
                    const filteredData = {
                        timestamp: data.Timestamp, // Mapping example
                        value: data.Value,
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