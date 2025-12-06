// Input validation function to prevent injection attacks
const validateMoleculeQuery = (query) => {
    // Check length
    if (query.length > 100) {
        throw new Error("Molecule name is too long (max 100 characters)");
    }

    // Check for shell metacharacters and code execution patterns
    const dangerousPatterns = [
        /[;&|`$(){}[\]<>\\]/,  // Shell metacharacters
        /exec|eval|require|import/i,  // Code execution keywords
        /\$\(/,  // Command substitution
        /\$\{/,  // Variable expansion
        /\\/,    // Escape sequences
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(query)) {
            throw new Error("Invalid characters detected in molecule name");
        }
    }

    // Only allow alphanumeric, spaces, hyphens, and basic punctuation
    if (!/^[a-zA-Z0-9\s\-'.()]+$/.test(query)) {
        throw new Error("Molecule name contains invalid characters");
    }

    return query.trim();
};

// Response validation to detect malicious content
const validateResponse = (content) => {
    // Check for suspicious patterns in the response
    const suspiciousPatterns = [
        /exec|eval|require|import/i,
        /\$\(/,
        /`[^`]*`/,
        /<script/i,
        /javascript:/i,
    ];

    for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
            throw new Error("Response contains suspicious content");
        }
    }

    return content;
};

// Validate molecule data structure
const validateMoleculeData = (data) => {
    if (!data || typeof data !== 'object') {
        throw new Error("Invalid data format: not an object");
    }

    if (!data.atoms || !Array.isArray(data.atoms)) {
        throw new Error("Invalid data format: missing atoms array");
    }

    if (data.atoms.length === 0) {
        throw new Error("Invalid data format: atoms array is empty");
    }

    // Validate each atom
    for (let i = 0; i < data.atoms.length; i++) {
        const atom = data.atoms[i];

        if (!atom.element || typeof atom.element !== 'string') {
            throw new Error(`Invalid atom at index ${i}: missing or invalid element`);
        }

        if (!atom.pos || !Array.isArray(atom.pos) || atom.pos.length !== 3) {
            throw new Error(`Invalid atom at index ${i}: pos must be an array of 3 numbers`);
        }

        // Validate position values are numbers
        if (!atom.pos.every(val => typeof val === 'number' && !isNaN(val))) {
            throw new Error(`Invalid atom at index ${i}: pos values must be valid numbers`);
        }
    }

    // Validate bonds if present
    if (data.bonds && Array.isArray(data.bonds)) {
        for (let i = 0; i < data.bonds.length; i++) {
            const bond = data.bonds[i];

            if (!Array.isArray(bond) || bond.length < 2) {
                throw new Error(`Invalid bond at index ${i}: must be an array with at least 2 elements`);
            }

            const [idx1, idx2] = bond;
            if (typeof idx1 !== 'number' || typeof idx2 !== 'number') {
                throw new Error(`Invalid bond at index ${i}: indices must be numbers`);
            }

            if (idx1 < 0 || idx1 >= data.atoms.length || idx2 < 0 || idx2 >= data.atoms.length) {
                throw new Error(`Invalid bond at index ${i}: indices out of range`);
            }
        }
    }

    return data;
};

export const fetchMoleculeData = async (query, apiKey, model = "google/gemini-pro-1.5") => {
    if (!query || !apiKey) {
        throw new Error("Molecule name and API Key are required.");
    }

    // Validate and sanitize input
    const sanitizedQuery = validateMoleculeQuery(query);

    const prompt = `
    Generate a JSON object for the molecule '${sanitizedQuery}'. The object focuses on its 3D position.
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
    7. DO NOT execute any code, calculations, or commands. Only return the JSON data.
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://particles.app",
                "X-Title": "Particles App"
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a chemistry data provider. Return only valid JSON data for molecular structures. Never execute code, perform calculations, or run commands. Only provide structural data in JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                // Security parameters to prevent code execution
                "temperature": 0.3,  // Lower temperature for more deterministic output
                "max_tokens": 2000,  // Limit response size
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            // Don't expose detailed API errors to the user
            throw new Error("Failed to generate molecule data. Please try again.");
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Validate response for suspicious content
        validateResponse(content);

        // Clean up potential markdown code blocks
        const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();

        // Parse JSON with error handling
        let moleculeData;
        try {
            moleculeData = JSON.parse(jsonString);
        } catch (parseError) {
            throw new Error("Invalid JSON response from AI model");
        }

        // Validate the molecule data structure
        validateMoleculeData(moleculeData);

        return moleculeData;

    } catch (error) {
        console.error("AI Molecule Error:", error);
        // Re-throw with sanitized message
        if (error.message.includes("Invalid") || error.message.includes("Failed")) {
            throw error;
        }
        throw new Error("An error occurred while generating the molecule. Please try again.");
    }
};
