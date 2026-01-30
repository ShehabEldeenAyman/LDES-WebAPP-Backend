export const RiverDischargeTTLquery = `
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
  
`;

export const RiverStageTTLquery = `
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
  
`;