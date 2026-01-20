import express from 'express';
import cors from 'cors'
//import ldesRouter from './routes/ldes.js'; // Import your new route file
import { ingestData,ingestToGraphDB } from './services/ldesService.js';
//import { queryGraphDB } from './routes/ldes/ldesSPARQLengine.js';
import { RiverStage1Year } from './routes/ldes/RiverStage1Year.js';
import {RiverDischarge1Year} from './routes/ldes/RiverDischarge1Year.js'

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.get('/ldes/RiverStage1Year', RiverStage1Year);
app.get('/ldes/RiverDischarge1Year', RiverDischarge1Year);


async function startServer() {
  try {
    console.log("Initializing LDES data...");
    
    // 3. This line blocks execution until ingestion is 100% done
    //await ingestData(); 
    // Ingestion runs in background
  ingestData().then(() => {
    console.log("Background ingestion finished!");
    ingestToGraphDB("http://localhost:7200", "ldes-cache");
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