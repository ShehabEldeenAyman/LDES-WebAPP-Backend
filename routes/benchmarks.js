export async function benchmarks(req, res, oxigraphLDESTSS_time, oxigraphLDES_time, virtuosoLDESTSS_time, virtuosoLDES_time,oxigraphTTL_time) {
    try {
        // Validation: Ensure the benchmark times are actually provided
        // if (oxigraphLDES_time === undefined || virtuosoLDES_time === undefined || oxigraphLDESTSS_time === undefined || virtuosoLDESTSS_time === undefined || oxigraphTTL_time === undefined) {
        //     throw new Error("Missing benchmark data.");
        // }

        res.status(200).json({
            oxigraph_time_series: oxigraphLDESTSS_time,
            oxigraph_standard_ldes: oxigraphLDES_time,
            virtuoso_time_series: virtuosoLDESTSS_time,
            virtuoso_standard_ldes: virtuosoLDES_time,
            oxigraph_ttl: oxigraphTTL_time
        });
    } catch (error) {
        console.error("Error in benchmarks route:", error.message);
        
        // Return a 500 Internal Server Error status so the frontend knows it failed
        res.status(500).json({ 
            error: "Failed to retrieve benchmark data.",
            message: error.message 
        });
    }
}