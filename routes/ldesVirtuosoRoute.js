export async function ldesVirtuosoRoute(req, res, sparqlQuery, VIRTUOSO_SPARQL_URL) {
  // Virtuoso typically expects queries via a 'query' parameter on its SPARQL endpoint.
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

    // Map the results based on the data shape seen in 02.trig and VirtuosoHandler
    const formattedData = result.results.bindings.map(binding => {
      try {
return {
          // Checks for ?subject (specific) OR ?s (generic)
          subject: (binding.subject || binding.s)?.value || null,
          
          // Checks for ?value (specific) OR ?p (generic predicate)
          value: (binding.value || binding.p)?.value || null,
          
          // Checks for ?time (specific) OR ?o (generic object)
          time: (binding.time || binding.o)?.value || null,
          
          // runoffValue remains specific as it's a custom property
          runoffValue: binding.runoffvalue ? binding.runoffvalue.value : null
        };
      } catch (e) {
        console.warn(`Failed to parse Virtuoso binding:`, e);
        return null;
      }
    }).filter(item => item !== null);

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Error in ldesVirtuosoRoute:", error);
    return res.status(500).json({ error: "Internal Server Error while querying Virtuoso." });
  }
}