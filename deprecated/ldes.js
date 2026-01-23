import express from 'express';
import { replicateLDES } from "ldes-client";
import { Store } from "oxigraph";

const ldesRouter = express.Router();

// Note: The path here is '/' because the prefix '/LDES' 
// will be defined in the main index.js file.
ldesRouter.get('/ldes', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const store = new Store();
    const ldesClient = replicateLDES({
      url: "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDES/LDES.trig",
      materialize: true,
    });

    const memberReader = ldesClient.stream({ highWaterMark: 10 }).getReader();

    while (true) {
      const { value: member, done } = await memberReader.read();
      if (done) break;

      const memberId = member.id.value;
      //const quads = member.quads;
      //res.write(`Processing member: ${memberId} \n`);
      //res.write(`data: ${JSON.stringify(member)}\n\n`);
      member.quads.forEach(quad => {
        const subject  = quad.subject.value
    const predicate = quad.predicate.value;
    const object = quad.object.value;

    // Add every quad from the member into the store
      member.quads.forEach(quad => store.add(quad));
    
    //res.write(`Subject: ${subject} | Predicate: ${predicate} | Object: ${object}\n`);
  });

    }

const sparqlQuery = `
      SELECT ?g ?subject ?predicate ?object
      WHERE {
        GRAPH ?g {
          ?subject ?predicate ?object .
        }
      }
      LIMIT 10
    `;
    const results = [];
    const queryResults = store.query(sparqlQuery);
    for (const binding of queryResults) {
      const row = {};
      // Oxigraph bindings provide the variable name (e.g., 'subject') 
      // which you can use to get the value
      row.graph = binding.get("g")?.value; // Get the graph name
      row.subject = binding.get("subject")?.value;
      row.predicate = binding.get("predicate")?.value;
      row.object = binding.get("object")?.value;
      results.push(row);
    }
    
    res.write("ldes processed successfully")
    res.end();
    return res.json({
      total_triples: store.size,
      query_results: results
    });


  } catch (err) {
    console.error("LDES Stream Error:", err);
    res.status(500).write('data: {"error": "Stream failed"}\n\n');
    res.end();
  }
});

export default ldesRouter;