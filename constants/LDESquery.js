// LDESquery.js

export const OXIGRAPH_BASE_URL_LDES = "http://localhost:7879/";
export const data_url_LDES = "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDES/LDES.trig";

// Change this to an arrow function
export const RiverDischarge1YearLDESquery = (limit, offset) => `
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
          FILTER(YEAR(?time) = 2025)
        }
      }
      ORDER BY DESC(?time)
      LIMIT ${limit}
      OFFSET ${offset}
    `;

// Change this to an arrow function
export const RiverStage1YearLDESquery = (limit, offset) => `
      PREFIX sosa: <http://www.w3.org/ns/sosa/>
      PREFIX ex: <http://example.com/ns#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      SELECT ?subject ?value ?time  
      WHERE {
        GRAPH ?g {
          ?subject sosa:observedProperty "River Stage" ;
                   sosa:hasSimpleResult ?value ;
                   sosa:resultTime ?time .
          FILTER(YEAR(?time) = 2020)
        }
      }
      ORDER BY DESC(?time)
      LIMIT ${limit}
      OFFSET ${offset}
    `;

//---------------------------------------------------------------

export const RiverDischarge1YearLDESqueryALL = () => `
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
          FILTER(YEAR(?time) = 2025)
        }
      }
      ORDER BY DESC(?time)

    `;

    export const RiverStage1YearLDESqueryALL = () => `
      PREFIX sosa: <http://www.w3.org/ns/sosa/>
      PREFIX ex: <http://example.com/ns#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

      SELECT ?subject ?value ?time  
      WHERE {
        GRAPH ?g {
          ?subject sosa:observedProperty "River Stage" ;
                   sosa:hasSimpleResult ?value ;
                   sosa:resultTime ?time .
          FILTER(YEAR(?time) = 2020)
        }
      }
      ORDER BY DESC(?time)

    `;
