// services/ldesService.js
import { replicateLDES } from "ldes-client";
import fetch from "node-fetch";

// Configuration
const BATCH_SIZE = 100; // Number of quads to send in one HTTP request
let isLoaded = false;

// Helper: Serialize a single RDFJS Quad to an N-Quad string
function serializeQuad(quad) {
  const serializeTerm = (term) => {
    if (term.termType === 'NamedNode') return `<${term.value}>`;
    if (term.termType === 'BlankNode') return `_:${term.value}`;
    if (term.termType === 'Literal') {
      const value = JSON.stringify(term.value); // Handle escaping quotes safely
      if (term.language) return `${value}@${term.language}`;
      if (term.datatype && term.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
        return `${value}^^<${term.datatype.value}>`;
      }
      return value;
    }
    if (term.termType === 'DefaultGraph') return '';
    throw new Error(`Unknown term type: ${term.termType}`);
  };

  const s = serializeTerm(quad.subject);
  const p = serializeTerm(quad.predicate);
  const o = serializeTerm(quad.object);
  const g = quad.graph.termType === 'DefaultGraph' ? '' : serializeTerm(quad.graph);

  // N-Quads format: S P O G .
  return `${s} ${p} ${o} ${g} .`.trim();
}

// 1. Ingestion Logic (Streaming directly to DB)
export async function ingestData(serverUrl = "http://localhost:7878") {
  if (isLoaded) {
    console.log("Data already loaded. Skipping ingestion.");
    return;
  }

  console.log(`Starting LDES ingestion directly to ${serverUrl}...`);
  
  const ldesClient = replicateLDES({
    url: "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDES/LDES.trig",
    materialize: true,
  });

  const memberReader = ldesClient.stream({ highWaterMark: 10 }).getReader();
  const storeEndpoint = `${serverUrl}/store`;

  let quadBuffer = [];
  let totalQuads = 0;

  // Helper to flush buffer to DB
  const flushBuffer = async () => {
    if (quadBuffer.length === 0) return;

    const nQuadsData = quadBuffer.join('\n');
    
    try {
      const response = await fetch(storeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/n-quads" },
        body: nQuadsData,
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`Failed to push batch: ${text}`);
      } else {
        totalQuads += quadBuffer.length;
        // Optional: Log progress periodically
        // console.log(`Ingested ${totalQuads} quads so far...`);
      }
    } catch (e) {
      console.error("Error pushing batch to Oxigraph:", e);
    }
    
    // Clear buffer
    quadBuffer = [];
  };

  while (true) {
    const { value: member, done } = await memberReader.read();
    if (done) break;

    // Convert member quads to N-Quad strings
    for (const quad of member.quads) {
      quadBuffer.push(serializeQuad(quad));
    }

    // If buffer is full, send to DB
    if (quadBuffer.length >= BATCH_SIZE) {
      await flushBuffer();
    }
  }

  // Flush any remaining data
  await flushBuffer();
  
  isLoaded = true;
  console.log(`Ingestion complete. Total quads ingested: ${totalQuads}`);
}

// 2. Query Logic (Proxies query to external DB)
// Note: This replaces the local store.query logic
export async function runQuery(sparqlQuery, serverUrl = "http://localhost:7878") {
  const queryEndpoint = `${serverUrl}/query`;
  
  // URL Encode the query for the POST body
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

    // Transform SPARQL JSON results to the flat format your app expects
    // Output: [{ "var1": "value1", "var2": "value2" }, ...]
    const results = json.results.bindings.map(binding => {
      const row = {};
      for (const key in binding) {
        row[key] = binding[key].value;
      }
      return row;
    });

    return results;

  } catch (error) {
    console.error("Error executing SPARQL query:", error);
    return [];
  }
}