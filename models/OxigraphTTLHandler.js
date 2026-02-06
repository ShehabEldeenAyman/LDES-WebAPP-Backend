import { Parser, Writer } from "n3";

export async function OxigraphTTLHandler(OXIGRAPH_URL, fileUrl, type, portno) {
  console.log(`Starting ${type} Service: Fetching TTL from URL...`);
  const allQuads = [];

  try {
    // 1. Clear existing data in Oxigraph
    await fetch(OXIGRAPH_URL, { method: 'DELETE' });
    console.log(`${type} Oxigraph store cleared on port ${portno}.`);

    // 2. Fetch the Turtle file from the URL
    const response = await fetch(fileUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch TTL file: ${response.statusText}`);
    }
    const ttlData = await response.text();

    // 3. Parse the Turtle data
    const parser = new Parser({ format: 'Turtle' });

    await new Promise((resolve, reject) => {
      parser.parse(ttlData, (error, quad) => {
        if (error) reject(error);
        if (quad) {
          allQuads.push(quad);
        } else {
          resolve();
        }
      });
    });

    // 4. Perform the upload and count unique objects
    if (allQuads.length > 0) {
      // Logic to count unique subjects (entities)
      const uniqueSubjects = new Set(allQuads.map(q => q.subject.value));
      const objectCount = uniqueSubjects.size;

      console.log(`Found ${objectCount} unique objects (from ${allQuads.length} total quads)`);
      console.log(`Uploading to ${type} Oxigraph`);
      
      await uploadToOxigraph(allQuads, OXIGRAPH_URL, type);
      console.log(`${type} upload successful.`);
console.log(`object count: ${objectCount}`);
      // Return the count for benchmarking
      return objectCount;
    } else {
      console.log("No data found in the fetched TTL file.");
      return 0;
    }

  } catch (error) {
    console.error(`Error in ${type} Service:`, error);
    throw error;
  }
}

async function uploadToOxigraph(quads, url, type) {
  try {
    const writer = new Writer({ format: 'N-Triples' });
    writer.addQuads(quads);

    const nTriples = await new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // CHANGE: Append 'store' to the URL if it's not already there
    // Or ensure the URL in constants.js ends correctly.
    const uploadUrl = url.endsWith('/') ? `${url}store` : `${url}/store`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/n-triples' },
      body: nTriples
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Oxigraph upload failed: ${response.statusText} - ${errorBody}`);
    }
  } catch (err) {
    console.error(`Error uploading to Oxigraph:`, err);
    throw err;
  }
}