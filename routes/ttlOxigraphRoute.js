export async function ttlOxigraphRoute(req, res, sparqlQuery, OXIGRAPH_BASE_URL) {
  const queryEndpoint = `${OXIGRAPH_BASE_URL.replace(/\/$/, '')}/query?query=${encodeURIComponent(sparqlQuery)}`;

  try {
    const response = await fetch(queryEndpoint, {
      method: 'GET',
      headers: { 'Accept': 'application/sparql-results+json' }
    });

    const result = await response.json();
    
    // DEBUG: Check this in your terminal to see if the database is actually finding rows
    //console.log(`Oxigraph returned ${result.results.bindings.length} rows.`);

const formattedData = result.results.bindings.map(binding => {
  try {
    // Log one binding to your terminal to see the actual keys Oxigraph uses
    // console.log("Sample Binding:", JSON.stringify(binding)); 

    return {
      subject: binding.subject?.value || null,
      value: binding.value?.value ? parseFloat(binding.value.value) : null,
      time: binding.time?.value || null,
      runoffValue: binding.runoffvalue?.value ? parseFloat(binding.runoffvalue.value) : null
    };
  } catch (e) {
    return null;
  }
}).filter(item => {
    // If this returns false, the row is removed from your final API response
    return item.subject !== null && item.value !== null;
});

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error in ttlOxigraphRoute:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}