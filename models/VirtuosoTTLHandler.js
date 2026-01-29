import { Parser, Writer } from "n3";

export async function VirtuosoTTLHandler(VIRTUOSO_URL, fileUrl, type, graphName) {
  console.log(`Starting ${type} Virtuoso TTL Service: Fetching from ${fileUrl}...`);
  const allQuads = [];

  try {
    // 1. Fetch the Turtle file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch TTL file: ${response.statusText}`);
    }
    const ttlData = await response.text();

    // 2. Parse the Turtle data into Quads
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

    // 3. Upload to Virtuoso
    if (allQuads.length > 0) {
      console.log(`Uploading ${allQuads.length} quads to ${type} Virtuoso graph: ${graphName}`);
      await uploadToVirtuoso(allQuads, VIRTUOSO_URL, graphName, type);
      console.log(`${type} Virtuoso TTL upload successful.`);
    } else {
      console.log(`No data found in TTL file for ${type}.`);
    }

  } catch (error) {
    console.error(`Error in ${type} Virtuoso TTL Service:`, error);
  }
}

async function uploadToVirtuoso(quads, url, graphName, type) {
  try {
    // Map Quads to Triples (removing the graph component for GSP compatibility)
    const triplesOnly = quads.map(q => ({
      subject: q.subject,
      predicate: q.predicate,
      object: q.object
    }));

    const writer = new Writer({ format: 'N-Triples' });
    writer.addQuads(triplesOnly);

    const nTriples = await new Promise((resolve, reject) => {
      writer.end((error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    // Construct the Graph Store Protocol URL
    const gspUrl = `${url}?graph=${encodeURIComponent(graphName)}`;

    const response = await fetch(gspUrl, {
      method: 'PUT', // Use PUT to clear and replace the graph data
      headers: { 
        'Content-Type': 'application/n-triples',
        // If you still have the 403 issue, uncomment the line below and use your password:
        // 'Authorization': 'Basic ' + Buffer.from('dba:my_secure_password').toString('base64')
      },
      body: nTriples
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Virtuoso responded with ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error(`Failed to upload ${type} TTL to Virtuoso:`, error.message);
    throw error;
  }
}