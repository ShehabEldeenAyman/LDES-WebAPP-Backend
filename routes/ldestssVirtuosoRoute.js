export async function ldestssVirtuosoRoute(req, res, sparqlQuery, VIRTUOSO_SPARQL_URL) {
  // Virtuoso expects queries via the 'query' parameter.
  const queryEndpoint = `${VIRTUOSO_SPARQL_URL}?query=${encodeURIComponent(sparqlQuery)}`;

  try {
    const response = await fetch(queryEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/sparql-results+json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Virtuoso Error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();

    // ============================================================
    // HIGHLIGHTED CHANGE: FLEXIBLE MAPPING FOR LDESTSS
    // ============================================================
    const formattedData = result.results.bindings.map(binding => {
      try {
        // 1. Generic Variable Mapping (?s ?p ?o support)
        const subject = (binding.subject || binding.s)?.value || null;
        const predicateOrValue = (binding.from || binding.p)?.value || null;
        const objectOrPointType = (binding.pointType || binding.o)?.value || null;

        // 2. LDESTSS specific logic: Only parse JSON if 'points' variable exists
        let parsedPoints = [];
        if (binding.points) {
          parsedPoints = JSON.parse(binding.points.value);
        }

        return {
          subject: subject,
          // We map these to the keys your LDESTSS frontend expects
          from: predicateOrValue,
          pointType: objectOrPointType,
          madeBySensor: binding.madeBySensor ? binding.madeBySensor.value : null,
          points: parsedPoints
        };
      } catch (e) {
        console.warn(`Failed to parse LDESTSS binding:`, e);
        return null; 
      }
    }).filter(item => item !== null);
    // ============================================================

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Error in ldestssVirtuosoRoute:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}