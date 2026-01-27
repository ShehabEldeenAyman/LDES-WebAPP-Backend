export async function ldesRoute(req, res, sparqlQuery, OXIGRAPH_BASE_URL_LDES) {
  const queryEndpoint = `${OXIGRAPH_BASE_URL_LDES}query?query=${encodeURIComponent(sparqlQuery)}`;

  try {
    const response = await fetch(queryEndpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/sparql-results+json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const result = await response.json();

    const formattedData = result.results.bindings.map(binding => {
      try {
        // We simply extract the values directly. 
        // We use optional chaining (?.) in case runoffvalue is missing for some rows.
        return {
          subject: binding.subject.value,
          value: binding.value.value,
          time: binding.time.value,
          // runoffvalue is only selected in the RiverDischarge query, so we check if it exists
          runoffValue: binding.runoffvalue ? binding.runoffvalue.value : null
        };
      } catch (e) {
        console.warn(`Failed to parse binding for subject ${binding.subject?.value}`, e);
        return null;
      }
    }).filter(item => item !== null);

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Query Error:", error);
    return res.status(500).json({ error: error.message });
  }
}