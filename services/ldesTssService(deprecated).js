import { replicateLDES } from "ldes-client";
import { Writer } from "n3"; // Add this to the top of your file
/**
 * Main service to stream LDES data and ingest it into GraphDB.
 * Implements batching to improve performance.
 */
export async function ldesTssService() {
  console.log("Starting LDES TSS Service stream...");
  const repoId = "LDES-TSS";
  const allQuads = [];

  try {
    // 1. Clear existing data
    await fetch(`http://localhost:7200/repositories/${repoId}/statements`, {
      method: 'DELETE'
    });
    console.log("Existing data cleared.");

    const ldesClient = replicateLDES({
      url: "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDESTSS/LDESTSS.trig",
      fetchOptions: { redirect: "follow" }
    });

    const memberReader = ldesClient.stream({ materialize: true }).getReader();

    // 2. Collect all quads from the stream
    let result = await memberReader.read();
    while (!result.done) {
      allQuads.push(...result.value.quads);
      result = await memberReader.read();
    }

    // 3. Upload everything at once
    if (allQuads.length > 0) {
      console.log(`Uploading ${allQuads.length} quads to GraphDB...`);
      await uploadToGraphDB(allQuads);
      console.log("LDES Stream processing and upload complete.");
    } else {
      console.log("No data found to upload.");
    }

  } catch (error) {
    console.error("Error in ldesTssService:", error);
  }
}

async function uploadToGraphDB(quads) {
  const repoId = "LDES-TSS";
  const url = `http://localhost:7200/repositories/${repoId}/statements`;

  try {
    // 1. Initialize the N3 Writer set to N-Quads format
    const writer = new Writer({ format: 'N-Quads' });
    
    // 2. Add all quads to the writer
    writer.addQuads(quads);

    // 3. Convert quads to a single N-Quads string
    const nQuads = await new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // 4. Send the request to GraphDB
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