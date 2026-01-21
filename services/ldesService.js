import { replicateLDES } from "ldes-client";
import fetch from "node-fetch";

const BATCH_SIZE = 200; // Reduced for memory safety
let isLoaded = false;

// Optimization: Use a more memory-efficient serialization
function serializeTerm(term) {
  switch (term.termType) {
    case 'NamedNode': return `<${term.value}>`;
    case 'BlankNode': return `_:${term.value}`;
    case 'Literal':
      let res = JSON.stringify(term.value);
      if (term.language) return `${res}@${term.language}`;
      if (term.datatype && term.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
        return `${res}^^<${term.datatype.value}>`;
      }
      return res;
    default:
      return '';
  }
}

export async function ingestData(serverUrl = "http://localhost:7878") {
  if (isLoaded) return;

  const ldesClient = replicateLDES({
    url: "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDES/LDES.trig",
    materialize: true,
  });

  const memberReader = ldesClient.stream({ highWaterMark: 5 }).getReader();
  const storeEndpoint = `${serverUrl}/store`;

  let quadBuffer = ""; // Use a single string buffer instead of an array
  let count = 0;
  let totalQuads = 0;

  try {
    while (true) {
      const { value: member, done } = await memberReader.read();
      if (done) break;

      for (const quad of member.quads) {
        const s = serializeTerm(quad.subject);
        const p = serializeTerm(quad.predicate);
        const o = serializeTerm(quad.object);
        const g = quad.graph.termType === 'DefaultGraph' ? '' : serializeTerm(quad.graph);
        
        // Append directly to string to avoid array overhead
        quadBuffer += `${s} ${p} ${o} ${g} .\n`;
        count++;
      }

      // Check if we hit the batch limit
      if (count >= BATCH_SIZE) {
        await pushToDb(storeEndpoint, quadBuffer);
        totalQuads += count;
        // Reset
        quadBuffer = "";
        count = 0;
      }
    }

    // Final flush
    if (quadBuffer.length > 0) {
      await pushToDb(storeEndpoint, quadBuffer);
      totalQuads += count;
    }

    isLoaded = true;
    console.log(`Ingestion complete. Total quads: ${totalQuads}`);
  } catch (err) {
    console.error("Ingestion failed:", err);
  }
}

async function pushToDb(endpoint, data) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/n-quads" },
    body: data,
  });
  
  if (!response.ok) throw new Error(`DB Sync Error: ${response.statusText}`);
}