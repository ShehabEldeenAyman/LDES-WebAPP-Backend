
export async function ttlVirtuosoRoute(req, res, sparqlQuery, VIRTUOSO_SPARQL_URL) {
  // Virtuoso SPARQL endpoint URL
  const queryEndpoint = `${VIRTUOSO_SPARQL_URL}?query=${encodeURIComponent(sparqlQuery)}`;

  try {
    const response = await fetch(queryEndpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/sparql-results+json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();

    const formattedData = result.results.bindings.map(binding => {
      try {
        return {
          subject: binding.subject ? binding.subject.value : null,
          // Convert value to a float to avoid the "full decimal" string issue if desired
          value: binding.value ? parseFloat(binding.value.value) : null,
          time: binding.time ? binding.time.value : null,
          runoffValue: binding.runoffvalue ? parseFloat(binding.runoffvalue.value) : null
        };
      } catch (e) {
        return null;
      }
    }).filter(item => item !== null);

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Error in VirtuosoTTLRoute:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}