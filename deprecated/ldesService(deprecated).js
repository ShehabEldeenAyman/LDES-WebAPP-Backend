// ldesService.js
import { replicateLDES } from "ldes-client";
import { Store } from "oxigraph";
import fetch from "node-fetch";

// 1. Initialize the store globally in this module
const store = new Store();
let isLoaded = false; // Flag to track if we already have data

// 2. Define the ingestion logic
export async function ingestData() {
  if (isLoaded) {
    console.log("Data already loaded. Skipping ingestion.");
    return;
  }

  console.log("Starting LDES ingestion...");
  const ldesClient = replicateLDES({
    url: "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDES/LDES.trig",
    materialize: true,
  });

  const memberReader = ldesClient.stream({ highWaterMark: 10 }).getReader();

  while (true) {
    const { value: member, done } = await memberReader.read();
    if (done) break;

    // Add quads to the shared store
    for (const quad of member.quads) {
      store.add(quad);
    }
  }
  
  isLoaded = true;
  console.log(`Ingestion complete. Store size: ${store.size}`);
}

// 3. Export a function to query the data
export function runQuery(sparqlQuery) {
  const results = [];
  // Run query on the shared store
  const queryResults = store.query(sparqlQuery);
  
  for (const binding of queryResults) {
    const row = {};
    binding.forEach((value, key) => {
      row[key] = value.value;
    });
    results.push(row);
  }
  return results;
}

// 4. Export the raw store if needed elsewhere
export function getStore() {
  return store;
}

// export async function ingestToGraphDB(serverUrl, repositoryId) {
//   try {
//     console.log(`Exporting Oxigraph data to GraphDB repository: ${repositoryId}...`);

//     // 1. Serialize Oxigraph store to N-Quads or N-Triples format
//     // GraphDB supports these formats for batch loading
//     const nQuadsData = store.dump("application/n-quads");

//     // 2. Construct the GraphDB Graph Store endpoint URL
//     // This endpoint is used for adding/replacing RDF data
//     const endpoint = `${serverUrl}/repositories/${repositoryId}/statements`;

//     // 3. POST the data to GraphDB
//     const response = await fetch(endpoint, {
//       method: "POST", // Use POST to append data, or PUT to replace everything
//       headers: {
//         "Content-Type": "application/n-quads",
//       },
//       body: nQuadsData,
//     });

//     if (response.ok) {
//       console.log("Successfully ingested Oxigraph data into GraphDB.");
//     } else {
//       const errorText = await response.text();
//       throw new Error(`GraphDB Ingestion Failed: ${response.status} - ${errorText}`);
//     }
//   } catch (error) {
//     console.error("Error during GraphDB ingestion:", error);
//     throw error;
//   }
// }

export async function ingestToOxigraph(serverUrl = "http://localhost:7878") {
  try {
    console.log(`Exporting Oxigraph data to external Oxigraph server at: ${serverUrl}...`);

    // 1. Serialize local Oxigraph store to N-Quads
    const nQuadsData = store.dump("application/n-quads");

    // 2. Oxigraph's store endpoint
    // POST /store adds data to the default graph or named graphs if specified
    const endpoint = `${serverUrl}/store`;

    // 3. POST the data
    const response = await fetch(endpoint, {
      method: "POST", 
      headers: {
        "Content-Type": "application/n-quads",
      },
      body: nQuadsData,
    });

    if (response.ok) {
      console.log("Successfully ingested data into Oxigraph Server.");
    } else {
      const errorText = await response.text();
      throw new Error(`Oxigraph Server Ingestion Failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("Error during Oxigraph Server ingestion:", error);
    throw error;
  }
}