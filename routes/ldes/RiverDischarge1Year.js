// RiverDischarge1Year.js
import { runQuery } from '../../services/ldesService.js';

export async function RiverDischarge1Year(req, res) {
  try {
    // Define the Oxigraph server URL
    const OXIGRAPH_URL = "http://localhost:7878";

    const sparqlQuery = `
      PREFIX sosa: <http://www.w3.org/ns/sosa/>
      PREFIX ex: <http://example.com/ns#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      SELECT ?subject ?value ?time ?runoffvalue
      WHERE {
        GRAPH ?g {
          ?subject sosa:observedProperty "River Discharge" ;
                   sosa:hasSimpleResult ?value ;
                   sosa:resultTime ?time ;
                   ex:runoffValue ?runoffvalue .
          
          # Filter to only include results from the year 2025
          FILTER(YEAR(?time) = 2025)
        }
      }
      ORDER BY DESC(?time)
    `;

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