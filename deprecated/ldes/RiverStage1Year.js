// RiverStage1Year.js
//import { runQuery } from '../../models/ldesService.js';

export async function RiverStage1Year(req, res) {
  try {
    // Define the Oxigraph server URL



    // Execute the query against the Oxigraph server using the new runQuery service
    const results = await runQuery(sparqlQuery, OXIGRAPH_URL);

    // Transform the results into a clean array of JSON objects
    // Note: ensure property names match what is returned by the SPARQL SELECT
    const formattedResults = results.map(observation => ({
      subject: observation.subject,
      value: observation.value,
      time: observation.time
    }));

    // Return the results as a JSON array
    res.status(200).json(formattedResults);

  } catch (error) {
    console.error("Query failed:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}