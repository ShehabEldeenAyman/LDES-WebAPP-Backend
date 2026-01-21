// services/ldesService.js
import { replicateLDES } from "ldes-client";
import fetch from "node-fetch";

// Configuration
const BATCH_SIZE = 200; // Lower batch size to prevent massive string allocations in RAM
let isLoaded = false;

/**
 * Optimized Serializer: Uses a switch for speed and handles 
 * terms without creating excessive intermediate objects.
 */
function serializeTerm(term) {
  switch (term.termType) {
    case 'NamedNode': 
      return `<${term.value}>`;
    case 'BlankNode': 
      return `_:${term.value}`;
    case 'Literal':
      const value = JSON.stringify(term.value);
      if (term.language) return `${value}@${term.language}`;
      if (term.datatype && term.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
        return `${value}^^<${term.datatype.value}>`;
      }
      return value;
    case 'DefaultGraph': 
      return '';
    default:
      return '';
  }
}

/**
 * 1. Ingestion Logic (Streaming directly to DB)
 * Optimized to prevent memory spikes on low-resource hardware like a Raspberry Pi.
 */
export async function ingestData(serverUrl = "http://localhost:7878") {
  if (isLoaded) {
    console.log("Data already loaded. Skipping ingestion.");
    return;
  }

  console.log(`Starting LDES ingestion to ${serverUrl}...`);
  
  const ldesClient = replicateLDES({
    url: "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDES/LDES.trig",
    materialize: true,
  });

  // highWaterMark: 5 limits the number of LDES members kept in the internal buffer
  const memberReader = ldesClient.stream({ highWaterMark: 5 }).getReader();
  const storeEndpoint = `${serverUrl}/store`;

  let quadBuffer = ""; 
  let currentBatchCount = 0;
  let totalQuads = 0;

  try {
    while (true) {
      const { value: member, done } = await memberReader.read();
      
      if (done) break;

      // Convert member quads to N-Quad strings and append to the string buffer
      for (const quad of member.quads) {
        const s = serializeTerm(quad.subject);
        const p = serializeTerm(quad.predicate);
        const o = serializeTerm(quad.object);
        const g = quad.graph.termType === 'DefaultGraph' ? '' : serializeTerm(quad.graph);

        quadBuffer += `${s} ${p} ${o} ${g} .\n`;
        currentBatchCount++;
      }

      // If buffer reaches BATCH_SIZE, await the push to create backpressure
      if (currentBatchCount >= BATCH_SIZE) {
        await pushBatch(storeEndpoint, quadBuffer);
        totalQuads += currentBatchCount;
        
        // Clear references immediately for Garbage Collection
        quadBuffer = "";
        currentBatchCount = 0;
      }
    }

    // Flush any remaining data at the end
    if (quadBuffer.length > 0) {
      await pushBatch(storeEndpoint, quadBuffer);
      totalQuads += currentBatchCount;
    }

    isLoaded = true;
    console.log(`Ingestion complete. Total quads ingested: ${totalQuads}`);

  } catch (error) {
    console.error("Critical error during ingestion:", error);
  }
}

/**
 * Helper to push the string buffer to Oxigraph.
 * Separate function to keep the main loop clean.
 */
async function pushBatch(endpoint, data) {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/n-quads" },
      body: data,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Database rejected batch: ${errText}`);
    }
  } catch (e) {
    throw new Error(`Failed to connect to Oxigraph: ${e.message}`);
  }
}

/**
 * 2. Query Logic
 * Proxies SPARQL queries to the external Oxigraph instance.
 */
export async function runQuery(sparqlQuery, serverUrl = "http://localhost:7878") {
  const queryEndpoint = `${serverUrl}/query`;
  
  const params = new URLSearchParams();
  params.append("query", sparqlQuery);

  try {
    const response = await fetch(queryEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/sparql-results+json" 
      },
      body: params
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    const json = await response.json();

    // Transform SPARQL JSON results to flat objects
    return json.results.bindings.map(binding => {
      const row = {};
      for (const key in binding) {
        row[key] = binding[key].value;
      }
      return row;
    });

  } catch (error) {
    console.error("Error executing SPARQL query:", error);
    return [];
  }
}