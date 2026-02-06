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

    // 3. Calculate unique object count and perform upload
    if (allQuads.length > 0) {
      // --- COUNT LOGIC ---
      const uniqueSubjects = new Set(allQuads.map(q => q.subject.value));
      const objectCount = uniqueSubjects.size;

      console.log(`Found ${objectCount} unique objects (from ${allQuads.length} total quads)`);
      console.log(`Uploading to ${type} Oxigraph on port ${portno}`);
      
      await uploadToOxigraph(allQuads, OXIGRAPH_URL, type);
      console.log(`${type} upload successfully.`);
      console.log(`object count: ${objectCount}`);
      // Return the count for the benchmark suite
      return objectCount;
    } else {
      console.log("No data found to upload.");
      return 0;
    }

  } catch (error) {
    console.error(`Error in ${type} Service:`, error);
    throw error; // Ensure the error is bubbled up to the benchmark runner
  }
}

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

    const response = await fetch(`${url}store`, {      
      method: 'POST',
      headers: { 'Content-Type': 'application/n-quads' },
      body: nQuads
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Oxigraph upload failed: ${errorText}`);
    }
  } catch (err) {
    console.error(`Error uploading to Oxigraph:`, err);
    throw err;
  }
}