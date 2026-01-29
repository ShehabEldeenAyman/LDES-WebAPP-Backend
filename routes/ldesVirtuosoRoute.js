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
          // 'subject' corresponds to the observation URI in the .trig file
          subject: binding.subject ? binding.subject.value : null,
          
          // 'value' corresponds to sosa:hasSimpleResult
          value: binding.value ? binding.value.value : null,
          
          // 'time' corresponds to sosa:resultTime
          time: binding.time ? binding.time.value : null,
          
          // 'runoffValue' is specific to River Discharge observations (ex:runoffValue)
          // Using optional chaining and checking existence as it's not in every observation
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