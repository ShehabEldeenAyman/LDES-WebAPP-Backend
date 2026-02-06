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
import {ingestBenchmarks,recallBenchmarks,objectcountBenchmarks } from './routes/benchmarks.js';
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

var virtuosoTTL_count = null;
var virtuosoLDES_count = null;
var virtuosoTSS_count = null;
var oxigraphTTL_count = null;
var oxigraphLDES_count = null;
var oxigraphTSS_count = null;

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

// query via front end form

app.get('/virtuoso/ldes/query', cacheMiddleware, async (req, res) => {
    try {
        // 1. Force the limit to 100 and calculate offset based on page
        const DEFAULT_LIMIT = 100;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * DEFAULT_LIMIT;
        
        // 2. Extract the raw SPARQL query
        const baseQuery = req.query.query;

        if (!baseQuery) {
            return res.status(400).json({ error: "No SPARQL query provided." });
        }

        // 3. Construct the final query with forced pagination
        // We trim the query to ensure we don't have conflicting LIMIT/OFFSET clauses
        const finalQuery = `
            ${baseQuery}
            LIMIT ${DEFAULT_LIMIT}
            OFFSET ${offset}
        `;

        // 4. Execute using your existing Virtuoso route logic
        // VIRTUOSO_URL should be your SPARQL endpoint (e.g., http://localhost:8890/sparql)
        await ldesVirtuosoRoute(req, res, finalQuery, VIRTUOSO_URL);

    } catch (error) {
        console.error("Error in Virtuoso query route:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/virtuoso/ldestss/query', cacheMiddleware, async (req, res) => {
    try {
        // 1. Force the limit to 100 and calculate offset based on page
        const DEFAULT_LIMIT = 100;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * DEFAULT_LIMIT;
        
        // 2. Extract the raw SPARQL query
        const baseQuery = req.query.query;

        if (!baseQuery) {
            return res.status(400).json({ error: "No SPARQL query provided." });
        }

        // 3. Construct the final query with forced pagination
        // We trim the query to ensure we don't have conflicting LIMIT/OFFSET clauses
        const finalQuery = `
            ${baseQuery}
            LIMIT ${DEFAULT_LIMIT}
            OFFSET ${offset}
        `;

        // 4. Execute using your existing Virtuoso route logic
        // VIRTUOSO_URL should be your SPARQL endpoint (e.g., http://localhost:8890/sparql)
        await ldestssVirtuosoRoute(req, res, finalQuery, VIRTUOSO_URL);

    } catch (error) {
        console.error("Error in Virtuoso query route:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get('/virtuoso/ttl/query', cacheMiddleware, async (req, res) => {
    try {
        // 1. Force the limit to 100 and calculate offset based on page
        const DEFAULT_LIMIT = 100;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * DEFAULT_LIMIT;
        
        // 2. Extract the raw SPARQL query
        const baseQuery = req.query.query;

        if (!baseQuery) {
            return res.status(400).json({ error: "No SPARQL query provided." });
        }

        // 3. Construct the final query with forced pagination
        // We trim the query to ensure we don't have conflicting LIMIT/OFFSET clauses
        const finalQuery = `
            ${baseQuery}
            LIMIT ${DEFAULT_LIMIT}
            OFFSET ${offset}
        `;

        // 4. Execute using your existing Virtuoso route logic
        // VIRTUOSO_URL should be your SPARQL endpoint (e.g., http://localhost:8890/sparql)
        await ttlVirtuosoRoute(req, res, finalQuery, VIRTUOSO_URL);

    } catch (error) {
        console.error("Error in Virtuoso query route:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




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

    app.get('/benchmarks/objectcount', (req, res) => {
    // This wrapper ensures we grab the LATEST values of the variables 
    // from the top-level scope every time the user hits the endpoint.
    objectcountBenchmarks(
        req, 
        res, 
        virtuosoTTL_count, 
        virtuosoLDES_count, 
        virtuosoTSS_count, 
        oxigraphTTL_count, 
        oxigraphLDES_count, 
        oxigraphTSS_count
    );
});
    // 1. Capture the start time
    var startTime = Date.now();
    oxigraphTSS_count =await OxigraphHandler(OXIGRAPH_BASE_URL_LDESTSS, data_url_LDESTSS, "LDESTSS", 7878).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      oxigraphLDESTSS_ingest_time = durationSeconds;
      
      console.log(`LDESTSS Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
     startTime = Date.now();

      oxigraphLDES_count =   await OxigraphHandler(OXIGRAPH_BASE_URL_LDES, data_url_LDES, "LDES", 7879).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      oxigraphLDES_ingest_time = durationSeconds;
      
      console.log(`LDES Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
    virtuosoLDES_count= await VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDES, "LDES", "http://example.org/graph/ldes").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      virtuosoLDES_ingest_time = durationSeconds;
      
      console.log(`LDES Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
       virtuosoTSS_count =  await VirtuosoHandler("http://localhost:8890/sparql-graph-crud", data_url_LDESTSS, "LDESTSS", "http://example.org/graph/ldestss").then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      virtuosoLDESTSS_ingest_time = durationSeconds;
      
      console.log(`LDESTSS Virtuoso ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
startTime = Date.now();
    oxigraphTTL_count =  await OxigraphTTLHandler(OXIGRAPH_BASE_URL_TTL, data_url_TTL, "TTL", 7877).then(() => {
      // 3. Capture end time when promise resolves
      const endTime = Date.now();
      
      // Calculate duration in seconds
      const durationSeconds = (endTime - startTime) / 1000;
      oxigraphTTL_ingest_time = durationSeconds;
      
      console.log(`TTL Oxigraph ingestion finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });
      
startTime = Date.now();
    virtuosoTTL_count = await VirtuosoTTLHandler("http://localhost:8890/sparql-graph-crud", data_url_TTL, "TTL", "http://example.org/graph/ttl").then(() => {
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
    console.log(`Virtuoso LDES recall finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
 });

 // --- Virtuoso LDESTSS ---
    startTime = Date.now();
    await ldestssVirtuosoRoute(mockReq, mockRes, RiverStage1YearTSSqueryALL(), VIRTUOSO_URL);
    await ldestssVirtuosoRoute(mockReq, mockRes, RiverDischarge1YearTSSqueryALL(), VIRTUOSO_URL).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        virtuosoLDESTSS_recall_time = durationSeconds;
        console.log(`Virtuoso LDESTSS recall finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });

    // --- Virtuoso TTL ---
    startTime = Date.now();
    await ttlVirtuosoRoute(mockReq, mockRes, RiverStage1YearTTLqueryVirtuosoALL(), VIRTUOSO_URL);
    await ttlVirtuosoRoute(mockReq, mockRes, RiverDischarge1YearTTLqueryVirtuosoALL(), VIRTUOSO_URL).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        virtuosoTTL_recall_time = durationSeconds;
        console.log(`Virtuoso TTL recall finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });

    // --- Oxigraph LDES ---
    startTime = Date.now();
    await ldesOxigraphRoute(mockReq, mockRes, RiverStage1YearLDESqueryALL(), OXIGRAPH_BASE_URL_LDES);
    await ldesOxigraphRoute(mockReq, mockRes, RiverDischarge1YearLDESqueryALL(), OXIGRAPH_BASE_URL_LDES).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        oxigraphLDES_recall_time = durationSeconds;
        console.log(`Oxigraph LDES recall finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });

    // --- Oxigraph LDESTSS ---
    startTime = Date.now();
    await ldestssOxigraphRoute(mockReq, mockRes, RiverStage1YearTSSqueryALL(), OXIGRAPH_BASE_URL_LDESTSS);
    await ldestssOxigraphRoute(mockReq, mockRes, RiverDischarge1YearTSSqueryALL(), OXIGRAPH_BASE_URL_LDESTSS).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        oxigraphLDESTSS_recall_time = durationSeconds;
        console.log(`Oxigraph LDESTSS recall finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
    });

    // --- Oxigraph TTL ---
    startTime = Date.now();
    await ttlOxigraphRoute(mockReq, mockRes, RiverStage1YearTTLqueryOxigraphALL(), OXIGRAPH_BASE_URL_TTL);
    await ttlOxigraphRoute(mockReq, mockRes, RiverDischarge1YearTTLqueryOxigraphALL(), OXIGRAPH_BASE_URL_TTL).then(() => {
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        oxigraphTTL_recall_time = durationSeconds;
        console.log(`Oxigraph TTL recall finished! Total time: ${durationSeconds.toFixed(2)} seconds.`);
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


startServer();
