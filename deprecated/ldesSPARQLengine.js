//load the oxigraph -> apply query -> transform data to json -> send it back
//load GraphDB -> apply query -> transform data to json -> send it back

import fetch from "node-fetch";

export async function queryGraphDB(serverUrl, repositoryId, sparqlQuery) {
  const endpoint = `${serverUrl}/repositories/${repositoryId}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/sparql-query",
        "Accept": "application/sparql-results+json",
      },
      body: sparqlQuery,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GraphDB Query Failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    //console.log(data)
    
    // Simplify the results to a list of plain objects
    return data.results.bindings.map(binding => {
      const row = {};
      for (const key in binding) {
        row[key] = binding[key].value;
      }
      return row;
    });

  } catch (error) {
    console.error("Error fetching from GraphDB:", error);
    throw error;
  }
}