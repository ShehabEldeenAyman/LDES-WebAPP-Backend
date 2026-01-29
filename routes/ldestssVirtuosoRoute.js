export async function ldestssVirtuosoRoute(req, res, sparqlQuery, VIRTUOSO_SPARQL_URL) {
  // Virtuoso expects queries via the 'query' parameter.
  const queryEndpoint = `${VIRTUOSO_SPARQL_URL}?query=${encodeURIComponent(sparqlQuery)}`;

  try {
    const response = await fetch(queryEndpoint, {
      method: 'GET',
      headers: {
        // Requesting standard SPARQL JSON results
        'Accept': 'application/sparql-results+json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Virtuoso Error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();

    const formattedData = result.results.bindings.map(binding => {
      try {
        // LDESTSS specific logic: Parse the JSON string contained in the "points" binding.
        // We use optional chaining and checks to ensure the data exists before parsing.
        const parsedPoints = binding.points ? JSON.parse(binding.points.value) : [];

        return {
          subject: binding.subject ? binding.subject.value : null,
          from: binding.from ? binding.from.value : null,
          pointType: binding.pointType ? binding.pointType.value : null,
          madeBySensor: binding.madeBySensor ? binding.madeBySensor.value : null,
          points: parsedPoints
        };
      } catch (e) {
        console.warn(`Failed to parse LDESTSS binding for subject ${binding.subject?.value}`, e);
        return null; 
      }
    }).filter(item => item !== null);

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Error in ldestssVirtuosoRoute:", error);
    return res.status(500).json({ error: "Internal Server Error while querying Virtuoso LDESTSS." });
  }
}