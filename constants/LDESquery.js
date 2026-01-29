export const OXIGRAPH_BASE_URL_LDES = "http://localhost:7879/";
export const data_url_LDES = "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDES/LDES.trig";
export const RiverDischarge1YearLDESquery = `
      PREFIX sosa: <http://www.w3.org/ns/sosa/>
      PREFIX ex: <http://example.com/ns#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      SELECT ?subject ?value ?time ?runoffvalue
      WHERE {
        GRAPH ?g {
          ?subject sosa:observedProperty "River Discharge" ;
                   sosa:hasSimpleResult ?value ;
                   sosa:resultTime ?time ;
                   ex:runoffValue ?runoffvalue .
          
          # Filter to only include results from the year 2025
          FILTER(YEAR(?time) = 2025)
        }
      }
      ORDER BY DESC(?time)
    `;

    export const RiverStage1YearLDESquery = `
      PREFIX sosa: <http://www.w3.org/ns/sosa/>
      PREFIX ex: <http://example.com/ns#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      SELECT ?subject ?value ?time  
      WHERE {
        GRAPH ?g {
          ?subject sosa:observedProperty "River Stage" ;
                   sosa:hasSimpleResult ?value ;
                   sosa:resultTime ?time .
          
          # Filter to only include results from the year 2025
          FILTER(YEAR(?time) = 2025)
        }
      }
      ORDER BY DESC(?time)
    `;    