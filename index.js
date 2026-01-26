import express from 'express';
import cors from 'cors'
//import ldesRouter from './routes/ldes.js'; // Import your new route file
//import { ingestData,ingestToOxigraph } from './services/ldesService.js';
//import { ingestData } from './models/ldesService.js';

//import { queryGraphDB } from './routes/ldes/ldesSPARQLengine.js';
// import { RiverStage1Year } from './routes/ldes/RiverStage1Year.js';
// import {RiverDischarge1Year} from './routes/ldes/RiverDischarge1Year.js'
import {ldesTssService} from './models/ldesTssService.js'
//import {RiverDischarge1YearTSS} from './routes/ldestss/RiverDischarge1YearTSS.js'
//import {RiverStage1YearTSS} from './routes/ldestss/RiverStage1YearTSS.js'
import {OXIGRAPH_BASE_URL_LDESTSS,RiverStage1YearTSSquery,RiverDischarge1YearTSSquery} from './queries/LDESTSSquery.js'
import {ldestssRoute} from './routes/ldestssRoute.js'

const app = express();
const PORT = 3000;
const OXIGRAPH_URL = "http://localhost:7878";

app.use(express.json());
// Replace the simple cors() with this:
app.use(cors({
  origin: '*', // For development only. In production, specify your frontend URL
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

// app.get('/ldes/RiverStage1Year', RiverStage1Year);
// app.get('/ldes/RiverDischarge1Year', RiverDischarge1Year);
app.get('/ldestss/RiverDischarge1Year', async (req, res) => {
  return ldestssRoute(req, res, RiverDischarge1YearTSSquery, OXIGRAPH_BASE_URL_LDESTSS);
});
app.get('/ldestss/RiverStage1Year', async (req, res) => {
  return ldestssRoute(req, res, RiverStage1YearTSSquery, OXIGRAPH_BASE_URL_LDESTSS);
});

async function startServer() {
try {
    console.log("Initializing LDES data...");

    // 1. Capture the start time
    const startTime = Date.now();
    await ldesTssService().then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      
      console.log(`LDESTSS ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
      
    
    // // 2. Start ingestion in the background
    // await ingestData(OXIGRAPH_URL).then(() => {
    //   // 3. Capture end time when promise resolves
    //   const endTime = Date.now();
      
    //   // Calculate duration in seconds
    //   const durationSeconds = (endTime - startTime) / 1000;
      
    //   console.log(`Background ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    // });
    
    console.log("Initialization finished. Starting web server...");

    // 4. Only start listening after data is ready
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

    //await ldesQueryTest1()

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}


// 5. Execute the startup function
startServer();