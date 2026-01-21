import { replicateLDES } from "ldes-client";

export async function ldesTssService() {
  console.log("Starting LDES TSS Service stream...");

  try {
    const ldesClient = replicateLDES({
      // Ensure this URL points to your .trig source
      url: "https://shehabeldeenayman.github.io/Mol_sluis_Dessel_Usecase/LDESTSS/LDESTSS.trig",
      fetchOptions: { redirect: "follow" },
    });

    const memberReader = ldesClient.stream({ 
      highWaterMark: 10,
      materialize: true 
    }).getReader();

    let member = await memberReader.read();

    while (!member.done) {
      const quads = member.value.quads;
      console.log(`\n--- Member ID: ${member.value.id} ---`);

      quads.forEach(quad => {
        console.log({
          graph: quad.graph.value, // Added to see the Named Graph from your .trig file
          subject: quad.subject.value,
          predicate: quad.predicate.value,
          object: quad.object.value,
          type: quad.object.termType
        });
      });

      member = await memberReader.read();
    }
    
    console.log("\n✅ LDES Stream processing complete.");
  } catch (error) {
    console.error("Error in ldesTssService:", error);
  }
}