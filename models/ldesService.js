import { replicateLDES } from "ldes-client";
import { Writer } from "n3";

const OXIGRAPH_URL = "http://localhost:7879/store";

export async function ldesService() {
  console.log("Starting LDES Service stream...");
  const allQuads = [];

  try {
    // 1. Clear existing data in Oxigraph
    // Oxigraph supports the Graph Store Protocol. DELETE on /store clears the default graph.
    await fetch(OXIGRAPH_URL, {
      method: 'DELETE'
    });
    console.log("LDESTSS Oxigraph store cleared on port 7879.");

    const ldesClient = replicateLDES({
      url: "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDES/LDES.trig",
      fetchOptions: { redirect: "follow" }
    });

    const memberReader = ldesClient.stream({ materialize: true }).getReader();

    // 2. Accumulate all data
    let result = await memberReader.read();
    while (!result.done) {
      allQuads.push(...result.value.quads);
      result = await memberReader.read();
    }

    // 3. Perform a single upload
    if (allQuads.length > 0) {
      console.log(`Uploading ${allQuads.length} quads to LDES Oxigraph on port 7879`);
      await uploadToOxigraph(allQuads);
      console.log("LDES upload successfully.");
    } else {
      console.log("No data found to upload.");
    }

  } catch (error) {
    console.error("Error in ldesService:", error);
  }
}

async function uploadToOxigraph(quads) {
  try {
    const writer = new Writer({ format: 'N-Quads' });
    writer.addQuads(quads);

    const nQuads = await new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // Oxigraph uses a POST to /store with the correct Content-Type for ingestion
    const response = await fetch(OXIGRAPH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/n-quads' },
      body: nQuads
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Oxigraph responded with ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("Failed to upload to Oxigraph:", error.message);
  }
}