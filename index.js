import express from 'express';
import cors from 'cors'
import {OXIGRAPH_BASE_URL_LDESTSS,RiverStage1YearTSSquery,RiverDischarge1YearTSSquery,data_url_LDESTSS} from './queries/LDESTSSquery.js'
import {OXIGRAPH_BASE_URL_LDES,RiverDischarge1YearLDESquery,RiverStage1YearLDESquery,data_url_LDES} from './queries/LDESquery.js'
import {ldestssOxigraphRoute} from './routes/ldestssOxigraphRoute.js'
import { ldesOxigraphRoute } from './routes/ldesOxigraphRoute.js';
import {OxigraphHandler} from './models/OxigraphHandler.js'
import { VirtuosoHandler } from './models/VirtuosoHandler.js';

const app = express();
const PORT = 3000;

app.use(express.json());
// Replace the simple cors() with this:
app.use(cors({
  origin: '*', // For development only. In production, specify your frontend URL
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

    app.get('/ldestss/RiverDischarge1Year', async (req, res) => {
  return ldestssOxigraphRoute(req, res, RiverDischarge1YearTSSquery, OXIGRAPH_BASE_URL_LDESTSS);
});
app.get('/ldestss/RiverStage1Year', async (req, res) => {
  return ldestssOxigraphRoute(req, res, RiverStage1YearTSSquery, OXIGRAPH_BASE_URL_LDESTSS);
});
app.get('/ldes/RiverDischarge1Year', async (req, res) => {
  return ldesOxigraphRoute(req, res, RiverDischarge1YearLDESquery, OXIGRAPH_BASE_URL_LDES);
});
app.get('/ldes/RiverStage1Year', async (req, res) => {
  return ldesOxigraphRoute(req, res, RiverStage1YearLDESquery, OXIGRAPH_BASE_URL_LDES);
});

// app.get('/ldes/RiverStage1Year', RiverStage1Year);
// app.get('/ldes/RiverDischarge1Year', RiverDischarge1Year);


async function startServer() {
try {
    console.log("Initializing LDESTSS data...");
    // 1. Capture the start time
    var startTime = Date.now();
    await OxigraphHandler(OXIGRAPH_BASE_URL_LDESTSS, data_url_LDESTSS, "LDESTSS", 7878).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      
      console.log(`LDESTSS Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
     startTime = Date.now();

        await OxigraphHandler(OXIGRAPH_BASE_URL_LDES, data_url_LDES, "LDES", 7879).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      
      console.log(`LDES Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
    await VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDES, "LDES", "http://example.org/graph/ldes").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      
      console.log(`LDES Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
        await VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDESTSS, "LDESTSS", "http://example.org/graph/ldestss").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      
      console.log(`LDESTSS Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
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