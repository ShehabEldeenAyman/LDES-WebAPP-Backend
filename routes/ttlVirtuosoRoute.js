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

    // ============================================================
    // HIGHLIGHTED CHANGE: FLEXIBLE MAPPING FOR TTL
    // ============================================================
    const formattedData = result.results.bindings.map(binding => {
      try {
        // Logic to support specific parsing for 'value' (Float) 
        // OR fallback to generic 'p' (Predicate URI string)
        let valueField = null;
        if (binding.value) {
            valueField = parseFloat(binding.value.value);
        } else if (binding.p) {
            valueField = binding.p.value;
        }

        return {
          // Checks for ?subject (specific) OR ?s (generic)
          subject: (binding.subject || binding.s)?.value || null,
          
          // Maps to the "Value / Predicate" column
          value: valueField,
          
          // Checks for ?time (specific) OR ?o (generic object)
          // Maps to the "Time / Object" column
          time: (binding.time || binding.o)?.value || null,
          
          // Runoff remains specific (generic queries likely won't have this)
          runoffValue: binding.runoffvalue ? parseFloat(binding.runoffvalue.value) : null
        };
      } catch (e) {
        console.warn("Failed to parse TTL binding:", e);
        return null;
      }
    }).filter(item => item !== null);
    // ============================================================

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error("Error in VirtuosoTTLRoute:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}