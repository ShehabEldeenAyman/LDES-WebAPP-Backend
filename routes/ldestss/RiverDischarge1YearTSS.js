export async function RiverDischarge1YearTSS(req, res) {
  const repoId = "LDES-TSS";
  const url = `http://localhost:7200/repositories/${repoId}`;

  // UPDATED QUERY:
  // 1. Selects the Snippet URI (?subject) and its attributes (from, pointType, points)
  // 2. Traverses 'tss:about' to find 'madeBySensor' and 'observedProperty'
  // 3. Filters explicitly for "River Discharge"
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
    const queryUrl = `${url}?query=${encodeURIComponent(sparqlQuery)}`;
    
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: { 
        'Accept': 'application/sparql-results+json' 
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: await response.text() });
    }

    const result = await response.json();

    const formattedData = result.results.bindings.map(binding => {
      try {
        // Parse the JSON string in "points" so it returns as a real JSON array, not a string
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
    }).filter(item => item !== null); // Remove any failed parses

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Query Error:", error);
    return res.status(500).json({ error: error.message });
  }
}