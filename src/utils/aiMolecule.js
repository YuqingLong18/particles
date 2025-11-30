export const fetchMoleculeData = async (query, apiKey, model = "google/gemini-pro-1.5") => {
    if (!query || !apiKey) {
        throw new Error("Molecule name and API Key are required.");
    }

    const prompt = `
    Generate a JSON object for the molecule '${query}'. The object focuses on its 3D position.
    The center of each atom should reflect the spatial relationship of the true structure of the molecule.
    The JSON must follow this exact schema:
    {
      "name": "Molecule Name",
      "atoms": [
        { "element": "Symbol", "pos": [x, y, z] }
      ],
      "bonds": [
        [index1, index2, order, type]
      ]
    }
    
    Rules:
    1. "pos" must be an array of 3 numbers (x, y, z) in Angstroms.
    2. "element" must be the standard chemical symbol (e.g., "C", "H", "O").
    3. "bonds" must be an array of arrays. Each inner array contains:
       - index1: Index of the first atom (0-based).
       - index2: Index of the second atom (0-based).
       - order: Bond order (1 for single, 2 for double, 3 for triple).
       - type: Bond type ("covalent" or "ionic").
    4. Center the molecule at [0, 0, 0].
    5. Provide accurate 3D geometry (bond lengths and angles).
    6. Return ONLY the JSON object, no markdown formatting or extra text.
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://particles.app", // Optional, for OpenRouter rankings
                "X-Title": "Particles App"
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    { "role": "user", "content": prompt }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Failed to fetch data from OpenRouter");
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Clean up potential markdown code blocks
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const moleculeData = JSON.parse(jsonString);

        // Basic validation
        if (!moleculeData.atoms || !Array.isArray(moleculeData.atoms)) {
            throw new Error("Invalid data format: missing atoms array");
        }

        return moleculeData;

    } catch (error) {
        console.error("AI Molecule Error:", error);
        throw error;
    }
};
