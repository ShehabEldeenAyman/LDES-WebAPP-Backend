export async function ldesRoute(req, res,sparqlQuery,OXIGRAPH_BASE_URL_LDESTSS) {
  const queryEndpoint = `${OXIGRAPH_BASE_URL_LDESTSS}/query`;

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
            subject: observation.subject,
            value: observation.value,
            time: observation.time
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