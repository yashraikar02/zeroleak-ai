// src/services/simulation.js
// Simple local "LLM" simulator for ZeroLeak AI hackathon demo.
// It receives the sanitized text (with placeholders) and returns a fake LLM response
// that may reorder or drop placeholders, plus a risk score.

/**
 * Simulate an external LLM processing.
 * @param {string} sanitizedText - Text sent to the external LLM (placeholders only).
 * @returns {Promise<{simulatedResponse:string, riskScore:number, droppedPlaceholders:string[]}>}
 */
export async function simulateLLM(sanitizedText) {
  // Simple randomization to mimic LLM behaviour:
  //  - 80% keep placeholders, 20% drop some.
  //  - Randomly reorder sentences.
  const placeholders = sanitizedText.match(/<[^>]+>/g) || [];
  const dropChance = 0.2;
  const kept = placeholders.filter(() => Math.random() > dropChance);
  const dropped = placeholders.filter(p => !kept.includes(p));

  // Build a fake response: use the sanitized text but replace kept placeholders with dummy values.
  let response = sanitizedText;
  kept.forEach((ph) => {
    const dummy = ph.replace(/^</, "").replace(/>$/, ""); // e.g., PERSON_1
    response = response.replaceAll(ph, dummy);
  });
  // Remove dropped placeholders entirely.
  dropped.forEach((ph) => {
    response = response.replaceAll(ph, "");
  });

  // Simple risk score: each dropped placeholder adds 10 points, each placeholder adds 2.
  const riskScore = kept.length * 2 + dropped.length * 10;

  // Simulate latency.
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));

  return {
    simulatedResponse: response.trim(),
    riskScore,
    droppedPlaceholders: dropped,
  };
}
