import { replicateLDES } from "ldes-client";
import { Writer } from "n3";

/**
 * Handles LDES stream replication and uploads to Virtuoso
 * @param {string} VIRTUOSO_URL - Base URL of Virtuoso (e.g., http://localhost:8890/sparql-graph-crud)
 * @param {string} data_url_LDESTSS - The LDES stream source URL
 * @param {string} type - Service type for logging
 * @param {string} graphName - The Named Graph URI to target
 */
export async function VirtuosoHandler(VIRTUOSO_URL, data_url_LDESTSS, type, graphName) {
  console.log(`Starting ${type} Virtuoso Service stream...`);
  const allQuads = [];

  try {
    // 1. Ensure the graph exists/is ready
    // Note: Virtuoso GSP usually creates the graph automatically on POST if it doesn't exist,
    // but we can explicitly "clear" it by using a PUT instead of POST if we want to overwrite.
    console.log(`Targeting graph: ${graphName}`);

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

    // 3. Upload to Virtuoso
    if (allQuads.length > 0) {
      console.log(`Uploading ${allQuads.length} quads to ${type} Virtuoso graph: ${graphName}`);
      await uploadToVirtuoso(allQuads, VIRTUOSO_URL, graphName, type);
      console.log(`${type} Virtuoso upload successful.`);
    } else {
      console.log("No data found to upload.");
    }

  } catch (error) {
    console.error(`Error in ${type} Virtuoso Service:`, error);
  }
}

async function uploadToVirtuoso(quads, url, graphName, type) {
  try {
    // 1. IMPORTANT: Map Quads to Triples by removing the graph component.
    // Virtuoso GSP ?graph= endpoint only accepts N-Triples (3 components).
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

    const gspUrl = `${url}?graph=${encodeURIComponent(graphName)}`;
    
    //console.log(`Sending data to Virtuoso GSP: ${gspUrl}`);

    const response = await fetch(gspUrl, {
      method: 'PUT', 
      headers: { 
        'Content-Type': 'application/n-triples', 
      },
      body: nTriples
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Virtuoso responded with ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error(`Failed to upload ${type} to Virtuoso:`, error.message);
    throw error;
  }
}