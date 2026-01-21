import express from 'express';
import cors from 'cors'
//import ldesRouter from './routes/ldes.js'; // Import your new route file
//import { ingestData,ingestToOxigraph } from './services/ldesService.js';
import { ingestData } from './services/ldesService.js';

//import { queryGraphDB } from './routes/ldes/ldesSPARQLengine.js';
import { RiverStage1Year } from './routes/ldes/RiverStage1Year.js';
import {RiverDischarge1Year} from './routes/ldes/RiverDischarge1Year.js'
import {ldesTssService} from './services/ldesTssService.js'

const app = express();
const PORT = 3000;
const OXIGRAPH_URL = "http://localhost:7878";

app.use(express.json());
app.use(cors());

app.get('/ldes/RiverStage1Year', RiverStage1Year);
app.get('/ldes/RiverDischarge1Year', RiverDischarge1Year);


async function startServer() {
try {
    console.log("Initializing LDES data...");

    // 1. Capture the start time
    const startTime = Date.now();
ldesTssService()
    // 2. Start ingestion in the background
    ingestData(OXIGRAPH_URL).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      
      console.log(`Background ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
    
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