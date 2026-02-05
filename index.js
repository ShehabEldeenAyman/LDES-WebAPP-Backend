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
import {ingestBenchmarks,recallBenchmarks } from './routes/benchmarks.js';
import {OxigraphTTLHandler} from './models/OxigraphTtlHandler.js';
import {CSV_URL,ttl_URL,OXIGRAPH_BASE_URL_TTL,data_url_TTL,VIRTUOSO_URL} from './constants/constants.js';
import {VirtuosoTTLHandler} from './models/VirtuosoTTLHandler.js';
import {ttlVirtuosoRoute} from './routes/ttlVirtuosoRoute.js';
import {RiverDischarge1YearTTLqueryVirtuoso,RiverStage1YearTTLqueryVirtuoso,RiverDischarge1YearTTLqueryOxigraph,RiverStage1YearTTLqueryOxigraph} from './constants/TTLquery.js'
import { ttlOxigraphRoute } from './routes/ttlOxigraphRoute.js';
import { cacheMiddleware } from './cache.js';
import { postgresHandler } from './models/PostgresHandler.js';
import { csvPostgresRoute } from './routes/csvPostgresRoute.js';
//--------------------------------------------------------------- All Queries
import {RiverDischarge1YearLDESqueryALL,RiverStage1YearLDESqueryALL} from './constants/LDESquery.js'
import {RiverDischarge1YearTSSqueryALL,RiverStage1YearTSSqueryALL} from './constants/LDESTSSquery.js'
import {RiverDischarge1YearTTLqueryOxigraphALL,RiverStage1YearTTLqueryOxigraphALL,RiverDischarge1YearTTLqueryVirtuosoALL,RiverStage1YearTTLqueryVirtuosoALL} from './constants/TTLquery.js'
//---------------------------------------------------------------

const app = express();
const PORT = 3000;

var oxigraphLDES_ingest_time = null;
var oxigraphLDESTSS_ingest_time = null;
var oxigraphTTL_ingest_time = null;
var virtuosoLDES_ingest_time = null;
var virtuosoLDESTSS_ingest_time = null;
var virtuosoTTL_ingest_time = null;
var postgresCSV_ingest_time = null;

var oxigraphLDES_recall_time = null;
var oxigraphLDESTSS_recall_time = null;
var oxigraphTTL_recall_time = null;
var virtuosoLDES_recall_time = null;
var virtuosoLDESTSS_recall_time = null;
var virtuosoTTL_recall_time = null;
var postgresCSV_recall_time = null;



app.use(express.json());
// Replace the simple cors() with this:
app.use(cors({
  origin: '*', // For development only. In production, specify your frontend URL
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept']
}));

// Helper function to handle pagination logic
const getPagination = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 100; // Default to 100 items per page
    const offset = (page - 1) * limit;
    return { limit, offset };
};



// --- PAGINATED ROUTES ---
// --- LDES ROUTES ---

app.get('/virtuoso/ldes/RiverStage1Year', cacheMiddleware, async (req, res) => { //done for all
    const { limit, offset } = getPagination(req.query);
    const query = RiverStage1YearLDESquery(limit, offset);
    await ldesVirtuosoRoute(req, res, query, VIRTUOSO_URL);
});

app.get('/virtuoso/ldes/RiverDischarge1Year', cacheMiddleware, async (req, res) => { //done for all
    const { limit, offset } = getPagination(req.query);
    const query = RiverDischarge1YearLDESquery(limit, offset);
    await ldesVirtuosoRoute(req, res, query, VIRTUOSO_URL);
});

app.get('/oxigraph/ldes/RiverStage1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverStage1YearLDESquery(limit, offset);
    await ldesOxigraphRoute(req, res, query, OXIGRAPH_BASE_URL_LDES);
});

app.get('/oxigraph/ldes/RiverDischarge1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverDischarge1YearLDESquery(limit, offset);
    await ldesOxigraphRoute(req, res, query, OXIGRAPH_BASE_URL_LDES);
});

// --- TSS ROUTES ---

app.get('/virtuoso/ldestss/RiverStage1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverStage1YearTSSquery(limit, offset);
    await ldestssVirtuosoRoute(req, res, query, VIRTUOSO_URL);
});

app.get('/virtuoso/ldestss/RiverDischarge1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverDischarge1YearTSSquery(limit, offset);
    await ldestssVirtuosoRoute(req, res, query, VIRTUOSO_URL);
});

app.get('/oxigraph/ldestss/RiverStage1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverStage1YearTSSquery(limit, offset);
    await ldestssOxigraphRoute(req, res, query, OXIGRAPH_BASE_URL_LDESTSS);
});

app.get('/oxigraph/ldestss/RiverDischarge1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverDischarge1YearTSSquery(limit, offset);
    await ldestssOxigraphRoute(req, res, query, OXIGRAPH_BASE_URL_LDESTSS);
});

// --- TTL ROUTES ---

app.get('/virtuoso/ttl/RiverStage1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverStage1YearTTLqueryVirtuoso(limit, offset);
    await ttlVirtuosoRoute(req, res, query, VIRTUOSO_URL);
});

app.get('/virtuoso/ttl/RiverDischarge1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverDischarge1YearTTLqueryVirtuoso(limit, offset);
    await ttlVirtuosoRoute(req, res, query, VIRTUOSO_URL);
});

app.get('/oxigraph/ttl/RiverStage1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverStage1YearTTLqueryOxigraph(limit, offset);
    await ttlOxigraphRoute(req, res, query, OXIGRAPH_BASE_URL_TTL);
});

app.get('/oxigraph/ttl/RiverDischarge1Year', cacheMiddleware, async (req, res) => {
    const { limit, offset } = getPagination(req.query);
    const query = RiverDischarge1YearTTLqueryOxigraph(limit, offset);
    await ttlOxigraphRoute(req, res, query, OXIGRAPH_BASE_URL_TTL);
});

// --- POSTGRES CSV ROUTES ---

app.get('/postgres/RiverDischarge1Year', async (req, res) => {
    try {
        const { limit, offset } = getPagination(req.query);
        const startDate = '2025-01-01T00:00:00Z';
        const endDate = '2025-12-31T23:59:59Z';
        
        const data = await csvPostgresRoute('River Discharge', startDate, endDate, limit, offset);
        res.json({
            count: data.length,
            page: (offset / limit) + 1,
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/postgres/RiverStage1Year', async (req, res) => {
    try {
        const { limit, offset } = getPagination(req.query);
        const startDate = '2025-01-01T00:00:00Z';
        const endDate = '2025-12-31T23:59:59Z';
        
        const data = await csvPostgresRoute('River Stage', startDate, endDate, limit, offset);
        res.json({
            count: data.length,
            page: (offset / limit) + 1,
            data: data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.get('/ingestbenchmarks', (req, res) => {
  ingestBenchmarks(req, res, oxigraphLDESTSS_ingest_time, oxigraphLDES_ingest_time, virtuosoLDESTSS_ingest_time, virtuosoLDES_ingest_time,oxigraphTTL_ingest_time,virtuosoTTL_ingest_time,postgresCSV_ingest_time);
});
app.get('/recallbenchmarks', (req, res) => {
  recallBenchmarks(req, res, oxigraphLDESTSS_recall_time, oxigraphLDES_recall_time, virtuosoLDESTSS_recall_time, virtuosoLDES_recall_time,oxigraphTTL_recall_time,virtuosoTTL_recall_time);
});
app.get('/csv', (req, res) => {
  // This will send a 302 redirect status to the browser
  res.redirect(CSV_URL);
});
app.get('/ttl', (req, res) => {
  // This will send a 302 redirect status to the browser
  res.redirect(ttl_URL);
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
      oxigraphLDESTSS_ingest_time = durationSeconds;
      
      console.log(`LDESTSS Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
     startTime = Date.now();

        await OxigraphHandler(OXIGRAPH_BASE_URL_LDES, data_url_LDES, "LDES", 7879).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      oxigraphLDES_ingest_time = durationSeconds;
      
      console.log(`LDES Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
    await VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDES, "LDES", "http://example.org/graph/ldes").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      virtuosoLDES_ingest_time = durationSeconds;
      
      console.log(`LDES Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
        await VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDESTSS, "LDESTSS", "http://example.org/graph/ldestss").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      virtuosoLDESTSS_ingest_time = durationSeconds;
      
      console.log(`LDESTSS Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
          await OxigraphTTLHandler(OXIGRAPH_BASE_URL_TTL, data_url_TTL, "TTL", 7877).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      oxigraphTTL_ingest_time = durationSeconds;
      
      console.log(`TTL Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
      
startTime = Date.now();
        await VirtuosoTTLHandler("http://localhost:8890/sparql-graph-crud", data_url_TTL, "TTL", "http://example.org/graph/ttl").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      virtuosoTTL_ingest_time = durationSeconds;
      
      console.log(`TTL Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });

    console.log("Initialization finished. Starting web server...");
  startTime = Date.now();
    await postgresHandler(CSV_URL).then(() => {
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      postgresCSV_ingest_time = durationSeconds;
      console.log(`CSV data ingestion into Postgres finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
//----------------------------------------------- BENCHMARK QUERIES ALL with mock req res
const mockReq = {}; 
const mockRes = {
    // Mock the status and json methods used in ldesVirtuosoRoute
    status: () => mockRes, 
    json: () => mockRes,
    text: () => mockRes
};

      startTime = Date.now();
    await ldesVirtuosoRoute(mockReq, mockRes, RiverStage1YearLDESqueryALL(), VIRTUOSO_URL);
     await ldesVirtuosoRoute(mockReq, mockRes, RiverDischarge1YearLDESqueryALL(), VIRTUOSO_URL).then(() => {
    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;
    virtuosoLDES_recall_time = durationSeconds;
 });

 // --- Virtuoso LDESTSS ---
    startTime = Date.now();
    await ldestssVirtuosoRoute(mockReq, mockRes, RiverStage1YearTSSqueryALL(), VIRTUOSO_URL);
    await ldestssVirtuosoRoute(mockReq, mockRes, RiverDischarge1YearTSSqueryALL(), VIRTUOSO_URL).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        virtuosoLDESTSS_recall_time = durationSeconds;
    });

    // --- Virtuoso TTL ---
    startTime = Date.now();
    await ttlVirtuosoRoute(mockReq, mockRes, RiverStage1YearTTLqueryVirtuosoALL(), VIRTUOSO_URL);
    await ttlVirtuosoRoute(mockReq, mockRes, RiverDischarge1YearTTLqueryVirtuosoALL(), VIRTUOSO_URL).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        virtuosoTTL_recall_time = durationSeconds;
    });

    // --- Oxigraph LDES ---
    startTime = Date.now();
    await ldesOxigraphRoute(mockReq, mockRes, RiverStage1YearLDESqueryALL(), OXIGRAPH_BASE_URL_LDES);
    await ldesOxigraphRoute(mockReq, mockRes, RiverDischarge1YearLDESqueryALL(), OXIGRAPH_BASE_URL_LDES).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        oxigraphLDES_recall_time = durationSeconds;
    });

    // --- Oxigraph LDESTSS ---
    startTime = Date.now();
    await ldestssOxigraphRoute(mockReq, mockRes, RiverStage1YearTSSqueryALL(), OXIGRAPH_BASE_URL_LDESTSS);
    await ldestssOxigraphRoute(mockReq, mockRes, RiverDischarge1YearTSSqueryALL(), OXIGRAPH_BASE_URL_LDESTSS).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        oxigraphLDESTSS_recall_time = durationSeconds;
    });

    // --- Oxigraph TTL ---
    startTime = Date.now();
    await ttlOxigraphRoute(mockReq, mockRes, RiverStage1YearTTLqueryOxigraphALL(), OXIGRAPH_BASE_URL_TTL);
    await ttlOxigraphRoute(mockReq, mockRes, RiverDischarge1YearTTLqueryOxigraphALL(), OXIGRAPH_BASE_URL_TTL).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        oxigraphTTL_recall_time = durationSeconds;
    });


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