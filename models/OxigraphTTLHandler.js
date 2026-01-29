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
          // Parsing finished (null quad indicates end of stream)
          resolve();
        }
      });
    });

    // 4. Perform the upload to Oxigraph
    if (allQuads.length > 0) {
      console.log(`Uploading ${allQuads.length} quads to ${type} Oxigraph`);
      await uploadToOxigraph(allQuads, OXIGRAPH_URL, type);
      console.log(`${type} upload successful.`);
    } else {
      console.log("No data found in the fetched TTL file.");
    }

  } catch (error) {
    console.error(`Error in ${type} Service:`, error);
  }
}

async function uploadToOxigraph(quads, url, type) {
  try {
    // We use N-Triples as it is the standard for flat triple data in Oxigraph
    const writer = new Writer({ format: 'N-Triples' });
    writer.addQuads(quads);

    const nTriples = await new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // Note: Oxigraph /store endpoint
    const response = await fetch(`${url}store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/n-triples' },
      body: nTriples
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Oxigraph upload failed: ${errorText}`);
    }
  } catch (err) {
    throw err;
  }
}