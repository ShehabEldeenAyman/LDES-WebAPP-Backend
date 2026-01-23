import { queryGraphDB } from '../engines/ldesSPARQLengine.js'

export async function RiverStage1Year(req, res) {
  try {
    const results = await queryGraphDB("http://localhost:7200", "ldes-cache", `
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX ex: <http://example.com/ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?subject ?value ?time  
WHERE {
  GRAPH ?g {
    ?subject sosa:observedProperty "River Stage" ;
             sosa:hasSimpleResult ?value ;
             sosa:resultTime ?time .
    
    # Filter to only include results from the year 2025
    FILTER(YEAR(?time) = 2025)
  }
}
ORDER BY DESC(?time)

    `);

    // Transform the results into a clean array of JSON objects if needed, 
    // or send the raw GraphDB results directly.
    const formattedResults = results.map(observation => ({
      subject: observation.subject,
      parameter: observation.parameter,
      value: observation.value,
      time: observation.time,
      //runoffvalue: observation.runoffvalue
      //message: `At ${observation.time}, the ${observation.parameter} was ${observation.value} meters.`
    }));

    // Return the results as a JSON array
    res.status(200).json(formattedResults);

  } catch (error) {
    console.error("Query failed:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}