import { replicateLDES } from "ldes-client";
import { Writer } from "n3";

export async function OxigraphHandler(OXIGRAPH_URL, data_url_LDESTSS, type, portno) {
  console.log(`Starting ${type} Service stream...`);
  const allQuads = [];

  try {
    // 1. Clear existing data in Oxigraph
    await fetch(OXIGRAPH_URL, {
      method: 'DELETE'
    });
    console.log(`${type} Oxigraph store cleared on port ${portno}.`);

    const ldesClient = replicateLDES({
      url: data_url_LDESTSS,
      fetchOptions: { redirect: "follow" }
    });

    const memberReader = ldesClient.stream({ materialize: true }).getReader();

    // 2. Accumulate all data
    let result = await memberReader.read();
    while (!result.done) {
      allQuads.push(...result.value.quads);
      result = await memberReader.read();
    }

    // 3. Perform a single upload - PASS VARIABLES HERE
    if (allQuads.length > 0) {
      console.log(`Uploading ${allQuads.length} quads to ${type} Oxigraph on port ${portno}`);
      await uploadToOxigraph(allQuads, OXIGRAPH_URL, type); // Fix 1: Pass arguments
      console.log(`${type} upload successfully.`);
    } else {
      console.log("No data found to upload.");
    }

  } catch (error) {
    console.error(`Error in ${type} Service:`, error);
  }
}

// Fix 2: Accept the arguments in the function definition
async function uploadToOxigraph(quads, url, type) {
  try {
    const writer = new Writer({ format: 'N-Quads' });
    writer.addQuads(quads);

    const nQuads = await new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // Use the 'url' parameter passed from above
const response = await fetch(`${url}store`, {      method: 'POST',
      headers: { 'Content-Type': 'application/n-quads' },
      body: nQuads
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Oxigraph responded with ${response.status}: ${errorText}`);
    }
  } catch (error) {
    // Use the 'type' parameter passed from above
    console.error(`Failed to upload ${type} to Oxigraph:`, error.message);
    throw error; // Rethrow so the parent catch block sees it
  }
}