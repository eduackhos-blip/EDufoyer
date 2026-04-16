import OpenAI from "openai";

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  // Debug: Log what we're getting
  console.log("🔍 Checking OpenAI API key...");
  console.log("API Key exists:", !!apiKey);
  console.log("API Key type:", typeof apiKey);
  console.log("API Key length:", apiKey ? apiKey.length : 0);
  console.log("API Key first 20 chars:", apiKey ? apiKey.substring(0, 20) : "N/A");
  console.log("API Key last 20 chars:", apiKey ? apiKey.substring(apiKey.length - 20) : "N/A");
  console.log("All env vars with OPENAI:", Object.keys(process.env).filter((k) => k.includes("OPENAI")));

  if (!apiKey || apiKey === "your-openai-api-key-here" || apiKey.trim() === "") {
    console.warn("⚠️ OpenAI API key not found or not configured. Subject validation will be skipped.");
    console.warn("Please add OPENAI_API_KEY to your .env file in the backend folder.");
    console.warn("Current process.env.OPENAI_API_KEY value:", apiKey || "undefined");
    return null;
  }

  // Trim any whitespace
  const trimmedKey = apiKey.trim();

  if (trimmedKey.length < 20) {
    console.error("❌ OpenAI API key seems too short. Expected length: ~200+ characters");
    return null;
  }

  console.log(
    "✅ OpenAI API key found. Validation enabled.",
    trimmedKey.substring(0, 20) + "..." + trimmedKey.substring(trimmedKey.length - 10)
  );

  return new OpenAI({
    apiKey: trimmedKey,
  });
};

/**
 * Validate if doubt description is related to the selected subject
 * @param {string} subject - Selected subject
 * @param {string} description - Doubt description
 * @returns {Promise<{isRelated: boolean, confidence: number, reason: string}>}
 */
export async function validateSubjectRelevance(subject, description) {
  console.log(`🔍 Starting subject validation: Subject="${subject}", Description="${description?.substring(0, 50)}..."`);

  const client = getOpenAIClient();

  // If OpenAI is not configured, allow submission (fail-open approach)
  if (!client) {
    console.warn("⚠️ OpenAI client not available. Allowing submission (validation skipped).");
    return {
      isRelated: true,
      confidence: 1.0,
      reason: "OpenAI validation not configured - submission allowed",
    };
  }

  try {
    console.log("📤 Sending validation request to OpenAI...");
    const systemPrompt = `You are an expert validator for an educational doubt-solving platform. 
Your task is to check if a student's doubt/question description is actually related to the subject they selected.

Rules:
1. Be strict but fair - only mark as related if the doubt is genuinely about the selected subject
2. Consider related topics and sub-topics within the subject
3. If the doubt is clearly about a different subject, mark as not related
4. Respond with a JSON object containing: isRelated (boolean), confidence (0-1), and reason (brief explanation)

Examples:
- Subject: "Operating Systems", Description: "How does process scheduling work?" → Related
- Subject: "Operating Systems", Description: "How to solve quadratic equations?" → Not Related
- Subject: "Mathematics", Description: "Explain calculus derivatives" → Related
- Subject: "Mathematics", Description: "How to write Python code?" → Not Related`;

    const userPrompt = `Subject: "${subject}"
Doubt Description: "${description}"

Is this doubt description related to the selected subject? Please analyze and respond with JSON.`;

    const completion = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 150,
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      console.error("OpenAI returned empty response");
      return {
        isRelated: true,
        confidence: 0.5,
        reason: "Validation service unavailable",
      };
    }

    const validationResult = JSON.parse(responseContent);

    const isRelated = validationResult.isRelated === true || validationResult.isRelated === "true";
    const confidence = parseFloat(validationResult.confidence) || 0.5;
    const reason = validationResult.reason || "No reason provided";

    console.log(`📥 Validation result: isRelated=${isRelated}, confidence=${confidence}, reason="${reason}"`);

    return {
      isRelated,
      confidence,
      reason,
    };
  } catch (error) {
    console.error("❌ OpenAI validation error:", error);
    console.warn("⚠️ Allowing submission despite validation error (fail-open approach)");
    return {
      isRelated: true,
      confidence: 0.5,
      reason: `Validation service error: ${error.message || "Unknown error"}. Submission allowed.`,
    };
  }
}

/**
 * Validate if image is related to the selected subject (optional feature)
 * @param {string} subject - Selected subject
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} description - Optional text description
 * @returns {Promise<{isRelated: boolean, confidence: number, reason: string}>}
 */
export async function validateImageSubjectRelevance(subject, imageBase64, description = "") {
  const client = getOpenAIClient();

  if (!client) {
    return {
      isRelated: true,
      confidence: 1.0,
      reason: "OpenAI validation not configured",
    };
  }

  try {
    const systemPrompt = `You are an expert validator. Check if the uploaded image content is related to the selected subject.
Respond with JSON: {"isRelated": true/false, "confidence": 0-1, "reason": "brief explanation"}`;

    const userPrompt = `Subject: "${subject}"
${description ? `Description: "${description}"` : ""}

Analyze the image and check if it's related to the subject.`;

    const completion = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 150,
    });

    const responseContent = completion.choices[0]?.message?.content;
    const validationResult = JSON.parse(responseContent);

    return {
      isRelated: validationResult.isRelated === true || validationResult.isRelated === "true",
      confidence: parseFloat(validationResult.confidence) || 0.5,
      reason: validationResult.reason || "No reason provided",
    };
  } catch (error) {
    console.error("OpenAI image validation error:", error);
    return {
      isRelated: true,
      confidence: 0.5,
      reason: "Validation service error - submission allowed",
    };
  }
}

