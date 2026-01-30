import express from 'express';
import cors from 'cors'
import {OXIGRAPH_BASE_URL_LDESTSS,RiverStage1YearTSSquery,RiverDischarge1YearTSSquery,data_url_LDESTSS} from './constants/LDESTSSquery.js'
import {OXIGRAPH_BASE_URL_LDES,RiverDischarge1YearLDESquery,RiverStage1YearLDESquery,data_url_LDES} from './constants/LDESquery.js'
import {ldestssOxigraphRoute} from './routes/ldestssOxigraphRoute.js'
import { ldesOxigraphRoute } from './routes/ldesOxigraphRoute.js';
import {OxigraphHandler} from './models/OxigraphHandler.js'
import { VirtuosoHandler } from './models/VirtuosoHandler.js';
import {ldesVirtuosoRoute} from './routes/ldesVirtuosoRoute.js';
import {ldestssVirtuosoRoute} from './routes/ldestssVirtuosoRoute.js';
import { benchmarks } from './routes/benchmarks.js';
import {OxigraphTTLHandler} from './models/OxigraphTtlHandler.js';
import {CSV_URL,ttl_URL,OXIGRAPH_BASE_URL_TTL,data_url_TTL,VIRTUOSO_URL} from './constants/constants.js';
import {VirtuosoTTLHandler} from './models/VirtuosoTTLHandler.js';
import {ttlVirtuosoRoute} from './routes/ttlVirtuosoRoute.js';
import {RiverDischargeTTLquery,RiverStageTTLquery} from './constants/TTLquery.js'

const app = express();
const PORT = 3000;

var oxigraphLDES_time = null;
var oxigraphLDESTSS_time = null;
var oxigraphTTL_time = null;
var virtuosoLDES_time = null;
var virtuosoLDESTSS_time = null;
var virtuosoTTL_time = null;

app.use(express.json());
// Replace the simple cors() with this:
app.use(cors({
  origin: '*', // For development only. In production, specify your frontend URL
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

    app.get('/ldestssOxigraph/RiverDischarge1Year', async (req, res) => {
  return ldestssOxigraphRoute(req, res, RiverDischarge1YearTSSquery, OXIGRAPH_BASE_URL_LDESTSS);
});
app.get('/ldestssOxigraph/RiverStage1Year', async (req, res) => {
  return ldestssOxigraphRoute(req, res, RiverStage1YearTSSquery, OXIGRAPH_BASE_URL_LDESTSS);
});
app.get('/ldesOxigraph/RiverDischarge1Year', async (req, res) => {
  return ldesOxigraphRoute(req, res, RiverDischarge1YearLDESquery, OXIGRAPH_BASE_URL_LDES);
});
app.get('/ldesOxigraph/RiverStage1Year', async (req, res) => {
  return ldesOxigraphRoute(req, res, RiverStage1YearLDESquery, OXIGRAPH_BASE_URL_LDES);
});
app.get('/ldesVirtuoso/RiverDischarge1Year', async (req, res) => {
  return ldesVirtuosoRoute(req, res, RiverDischarge1YearLDESquery, VIRTUOSO_URL);
});
app.get('/ldesVirtuoso/RiverStage1Year', async (req, res) => {
  return ldesVirtuosoRoute(req, res, RiverStage1YearLDESquery, VIRTUOSO_URL);
});
app.get('/ldestssVirtuoso/RiverDischarge1Year', async (req, res) => {
  return ldestssVirtuosoRoute(req, res, RiverDischarge1YearTSSquery, VIRTUOSO_URL);
});
app.get('/ldestssVirtuoso/RiverStage1Year', async (req, res) => {
  return ldestssVirtuosoRoute(req, res, RiverStage1YearTSSquery, VIRTUOSO_URL);
});
app.get('/benchmarks', (req, res) => {
  benchmarks(req, res, oxigraphLDESTSS_time, oxigraphLDES_time, virtuosoLDESTSS_time, virtuosoLDES_time,oxigraphTTL_time,virtuosoTTL_time);
});
app.get('/csv', (req, res) => {
  // This will send a 302 redirect status to the browser
  res.redirect(CSV_URL);
});
app.get('/ttl', (req, res) => {
  // This will send a 302 redirect status to the browser
  res.redirect(ttl_URL);
});
// app.get('/TTLvirtuoso/RiverDischarge1Year', (req, res) => {
//   ttlVirtuosoRoute(req, res, RiverDischargeTTLquery, "http://localhost:8890/sparql");
// });

app.get('/TTLvirtuoso/RiverDischarge1Year', (req, res) => {
  const limit = req.query.limit || 100;
  const offset = req.query.offset || 0;
  const paginatedQuery = `${RiverDischargeTTLquery} LIMIT ${limit} OFFSET ${offset}`;
  ttlVirtuosoRoute(req, res, paginatedQuery, "http://localhost:8890/sparql");
});

// Route for TTL River Stage
app.get('/TTLvirtuoso/RiverStage1Year', (req, res) => {
  ttlVirtuosoRoute(req, res, RiverStageTTLquery, "http://localhost:8890/sparql");
});

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
      oxigraphLDESTSS_time = durationSeconds;
      
      console.log(`LDESTSS Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
     startTime = Date.now();

        await OxigraphHandler(OXIGRAPH_BASE_URL_LDES, data_url_LDES, "LDES", 7879).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      oxigraphLDES_time = durationSeconds;
      
      console.log(`LDES Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
    await VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDES, "LDES", "http://example.org/graph/ldes").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      virtuosoLDES_time = durationSeconds;
      
      console.log(`LDES Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
        await VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDESTSS, "LDESTSS", "http://example.org/graph/ldestss").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      virtuosoLDESTSS_time = durationSeconds;
      
      console.log(`LDESTSS Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
          await OxigraphTTLHandler(OXIGRAPH_BASE_URL_TTL, data_url_TTL, "TTL", 7877).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      oxigraphTTL_time = durationSeconds;
      
      console.log(`TTL Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
      
startTime = Date.now();
        await VirtuosoTTLHandler("http://localhost:8890/sparql-graph-crud", data_url_TTL, "TTL", "http://example.org/graph/ttl").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      virtuosoTTL_time = durationSeconds;
      
      console.log(`TTL Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
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

// async function startServer() { //parallel version
//   try {
//     console.log("Initializing data in parallel...");
//     const globalStartTime = Date.now();

//     // Wrap your handlers in helper functions to track their individual timing
//     const runOxigraphLDESTSS = () => {
//       const start = Date.now();
//       return OxigraphHandler(OXIGRAPH_BASE_URL_LDESTSS, data_url_LDESTSS, "LDESTSS", 7878)
//         .then(() => console.log(`LDESTSS Oxigraph finished in ${((Date.now() - start) / 1000).toFixed(2)}s`));
//     };

//     const runOxigraphLDES = () => {
//       const start = Date.now();
//       return OxigraphHandler(OXIGRAPH_BASE_URL_LDES, data_url_LDES, "LDES", 7879)
//         .then(() => console.log(`LDES Oxigraph finished in ${((Date.now() - start) / 1000).toFixed(2)}s`));
//     };

//     const runVirtuosoLDES = () => {
//       const start = Date.now();
//       return VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDES, "LDES", "http://example.org/graph/ldes")
//         .then(() => console.log(`LDES Virtuoso finished in ${((Date.now() - start) / 1000).toFixed(2)}s`));
//     };

//     const runVirtuosoLDESTSS = () => {
//       const start = Date.now();
//       return VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDESTSS, "LDESTSS", "http://example.org/graph/ldestss")
//         .then(() => console.log(`LDESTSS Virtuoso finished in ${((Date.now() - start) / 1000).toFixed(2)}s`));
//     };

//     // Execute all four tasks in parallel
//     await Promise.all([
//       runOxigraphLDESTSS(),
//       runOxigraphLDES(),
//       runVirtuosoLDES(),
//       runVirtuosoLDESTSS()
//     ]);

//     const totalDuration = (Date.now() - globalStartTime) / 1000;
//     console.log(`Total Initialization finished in ${totalDuration.toFixed(2)} seconds.`);

//     app.listen(PORT, () => {
//       console.log(`Server running on http://localhost:${PORT}`);
//     });

//   } catch (error) {
//     console.error("Failed to start server:", error);
//     process.exit(1);
//   }
// }