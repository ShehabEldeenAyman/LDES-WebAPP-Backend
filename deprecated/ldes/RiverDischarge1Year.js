// RiverDischarge1Year.js
// import { runQuery } from '../../services/ldesService.js';

export async function RiverDischarge1Year(req, res) {
  try {
    // Define the Oxigraph server URL

    

    // Execute the query against the Oxigraph server
    const results = await runQuery(sparqlQuery, OXIGRAPH_URL);

    // Transform the results into a clean array of JSON objects
    const formattedResults = results.map(observation => ({
      subject: observation.subject,
      value: observation.value,
      time: observation.time,
      //runoffvalue: observation.runoffvalue we will deal with runoff value later
    }));

    // Return the results as a JSON array
    res.status(200).json(formattedResults);

  } catch (error) {
    console.error("Query failed:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}