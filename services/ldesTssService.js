import { replicateLDES } from "ldes-client";

/**
 * Main service to stream LDES data and ingest it into GraphDB.
 * Implements batching to improve performance.
 */
export async function ldesTssService() {
  console.log("Starting LDES TSS Service stream...");
  const repoId = "LDES-TSS";
  const BATCH_SIZE = 100000; // Adjust this: higher numbers are faster but use more memory

  try {
    // 1. Clear existing data to prevent duplicates
    await fetch(`http://localhost:7200/repositories/${repoId}/statements`, {
      method: 'DELETE'
    });
    console.log("Existing data cleared. Starting fresh import...");

    const ldesClient = replicateLDES({
      url: "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDESTSS/LDESTSS.trig",
        fetchOptions: { redirect: "follow" }
      //  ,from: new Date("2024-01-01T00:00:00Z"),  // After 2024 (Start of 2024)
      // until: new Date("2026-01-01T00:00:00Z")  // Before 2026 (Start of 2026)
    });

    const memberReader = ldesClient.stream({ 
      highWaterMark: 100,
      materialize: true 
    }).getReader();

    let member = await memberReader.read();
    let currentBatch = [];
    let count = 0;

    // 2. Process the stream with batching
    while (!member.done) {
      // Add this member's quads to our current batch array
      currentBatch.push(...member.value.quads);
      count++;

      // If we reached the BATCH_SIZE, upload the current collection
      if (count >= BATCH_SIZE) {
        await uploadToGraphDB(currentBatch);
        console.log(`Uploaded batch: ${count} members processed.`);
        currentBatch = []; // Reset batch
        count = 0;
      }

      member = await memberReader.read();
    }

    // 3. Upload any remaining quads in the final batch
    if (currentBatch.length > 0) {
      await uploadToGraphDB(currentBatch);
      console.log("Uploaded final batch.");
    }
    
    console.log("\n LDES Stream processing complete.");
  } catch (error) {
    console.error("Error in ldesTssService:", error);
  }
}

/**
 * Optimized upload function for GraphDB using N-Quads format.
 * @param {Array} quads - Array of quads to be uploaded in a single request.
 */
async function uploadToGraphDB(quads) {
  const repoId = "LDES-TSS";
  const url = `http://localhost:7200/repositories/${repoId}/statements`;

  // Efficiently map all quads to N-Quads string format
  const nQuads = quads.map(q => {
    // Format Subject
    const s = q.subject.termType === 'BlankNode' ? `_:${q.subject.value}` : `<${q.subject.value}>`;
    
    // Format Predicate
    const p = `<${q.predicate.value}>`;
    
    // Format Object
    let o;
    if (q.object.termType === 'Literal') {
      const escapedValue = q.object.value.replace(/"/g, '\\"');
      if (q.object.language) {
        o = `"${escapedValue}"@${q.object.language}`;
      } else if (q.object.datatype && q.object.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
        o = `"${escapedValue}"^^<${q.object.datatype.value}>`;
      } else {
        o = `"${escapedValue}"`;
      }
    } else if (q.object.termType === 'BlankNode') {
      o = `_:${q.object.value}`;
    } else {
      o = `<${q.object.value}>`;
    }

    // Format Graph (with mandatory space before dot for N-Quads)
    const g = (q.graph && q.graph.value && q.graph.value !== '' && q.graph.termType !== 'DefaultGraph') 
              ? `<${q.graph.value}> ` 
              : '';
    
    return `${s} ${p} ${o} ${g}.`;
  }).join('\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/n-quads' },
      body: nQuads
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GraphDB responded with ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("Failed to upload batch to GraphDB:", error.message);
  }
}