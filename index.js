require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
});

const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 200,
    responseMimeType: "text/plain",
};

async function analyzeEmail(emailContent) {
    const chatSession = model.startChat({ generationConfig });

    const prompt = `Analyze the following email and classify it as either "Spam" or "Not Spam". Also, provide a confidence score (0-100). Email: ${emailContent}`;

    const result = await chatSession.sendMessage(prompt);
    const responseText = result.response.text();

    // Extract classification and confidence
    const isSpam = responseText.includes("Spam");
    const confidenceMatch = responseText.match(/\d+/);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[0], 10) : 75;

    return { isSpam, confidence, rawResponse: responseText };
}

// Example usage
const emailText = "Congratulations! You've won a free iPhone. Click here to claim.";
analyzeEmail(emailText).then(result => console.log(result));
