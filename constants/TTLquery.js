export const RiverDischargeTTLqueryVirtuoso = (limit, offset) =>`
  PREFIX sosa: <http://www.w3.org/ns/sosa/>
  PREFIX ex: <http://example.com/ns#>
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

  SELECT ?subject ?value ?time ?runoffvalue
  WHERE {
      ?subject a sosa:Observation ;
               sosa:observedProperty "River Discharge" ;
               sosa:hasSimpleResult ?value ;
               sosa:resultTime ?time ;
               ex:runoffValue ?runoffvalue .
      
      FILTER(YEAR(?time) = 2025)
  }
  ORDER BY DESC(?time)
  LIMIT ${limit}
  OFFSET ${offset}
`;

export const RiverStageTTLqueryVirtuoso = (limit, offset) =>`
  PREFIX sosa: <http://www.w3.org/ns/sosa/>
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

  SELECT ?subject ?value ?time  
  WHERE {
      ?subject a sosa:Observation ;
               sosa:observedProperty "River Stage" ;
               sosa:hasSimpleResult ?value ;
               sosa:resultTime ?time .
               
      FILTER(YEAR(?time) = 2020)
  }
  ORDER BY DESC(?time)
  LIMIT ${limit}
  OFFSET ${offset}
`;

export const RiverDischargeTTLqueryOxigraph = (limit, offset) =>`
  PREFIX sosa: <http://www.w3.org/ns/sosa/>
  PREFIX ex: <http://example.com/ns#>
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

  SELECT ?subject ?value ?time ?runoffvalue
  WHERE {
    GRAPH ?g {
      ?subject a sosa:Observation ;
               sosa:observedProperty "River Discharge" ;
               sosa:hasSimpleResult ?value ;
               sosa:resultTime ?time .
      
      OPTIONAL { ?subject ex:runoffValue ?runoffvalue . }
      
      # Use STRSTARTS to be safe if the data type is just a string
      FILTER(STRSTARTS(STR(?time), "2025"))
    }
  }
  ORDER BY DESC(?time)
  LIMIT ${limit}
  OFFSET ${offset}
`;

export const RiverStageTTLqueryOxigraph = (limit, offset) =>`
  PREFIX sosa: <http://www.w3.org/ns/sosa/>
  PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

  SELECT ?subject ?value ?time  
  WHERE {
    GRAPH ?g {
      ?subject a sosa:Observation ;
               sosa:observedProperty "River Stage" ;
               sosa:hasSimpleResult ?value ;
               sosa:resultTime ?time .
               
      FILTER(STRSTARTS(STR(?time), "2020"))
    }
  }
  ORDER BY DESC(?time)
  LIMIT ${limit}
  OFFSET ${offset}
`;