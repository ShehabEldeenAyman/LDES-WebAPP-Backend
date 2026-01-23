export async function RiverDischarge1YearTSS(req, res) {
  const OXIGRAPH_BASE_URL = "http://localhost:7878"; // Base URL for Oxigraph
  const queryEndpoint = `${OXIGRAPH_BASE_URL}/query`;

  const sparqlQuery = `
PREFIX tss: <https://w3id.org/tss#>
PREFIX sosa: <http://www.w3.org/ns/sosa/>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

SELECT ?subject ?from ?pointType ?madeBySensor ?points
WHERE {
  GRAPH ?g {
    ?subject a tss:Snippet ;
             tss:from ?from ;
             tss:pointType ?pointType ;
             tss:points ?points ;
             tss:about ?template .
    
    ?template sosa:madeBySensor ?madeBySensor ;
              sosa:observedProperty "River Discharge" .
    
    FILTER (?from >= "2025-01-01T00:00:00Z"^^xsd:dateTime && 
            ?from < "2026-01-01T00:00:00Z"^^xsd:dateTime)
  }
}
ORDER BY ASC(?from)
  `;

  try {
    // Oxigraph prefers POST for queries with URL-encoded bodies
    const params = new URLSearchParams();
    params.append("query", sparqlQuery);

    const response = await fetch(queryEndpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/sparql-results+json' 
      },
      body: params
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();

    const formattedData = result.results.bindings.map(binding => {
      try {
        // Parse the JSON string in "points"
        const parsedPoints = JSON.parse(binding.points.value);

        return {
          subject: binding.subject.value,
          from: binding.from.value,
          pointType: binding.pointType.value,
          madeBySensor: binding.madeBySensor.value,
          points: parsedPoints
        };
      } catch (e) {
        console.warn(`Failed to parse points for subject ${binding.subject.value}`, e);
        return null; 
      }
    }).filter(item => item !== null);

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Query Error:", error);
    return res.status(500).json({ error: error.message });
  }
}