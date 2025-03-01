require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.use(express.json());
app.use(cors());

app.post("/api/classify", async (req, res) => {
    try {
        const { emailContent } = req.body;
        
        if (!emailContent) {
            return res.status(400).json({
                isSpam: false,
                confidence: 0,
                reasons: ["No email content provided"],
                riskLevel: "low"
            });
        }

        const prompt = `You are a spam detection system. Analyze this email content and classify it as spam or not spam.
        Return ONLY the JSON object without any markdown formatting or code blocks. The response should be an exact JSON object with this structure:
        {
            "isSpam": boolean,
            "confidence": number between 1 and 100,
            "reasons": array of strings explaining the classification,
            "riskLevel": "low" or "medium" or "high"
        }

        Email content to analyze:
        ${emailContent}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let responseText = response.text();
        
        // Remove markdown code block if present
        responseText = responseText.replace(/```json\n/, '').replace(/```/, '').trim();
        
        try {
            const classification = JSON.parse(responseText);
            // Validate the response structure
            if (!classification.hasOwnProperty('isSpam') || 
                !classification.hasOwnProperty('confidence') || 
                !classification.hasOwnProperty('reasons') || 
                !classification.hasOwnProperty('riskLevel')) {
                throw new Error('Invalid response structure');
            }
            res.json(classification);
        } catch (parseError) {
            console.error("Parse error:", parseError);
            console.log("Raw response:", responseText);
            // If parsing fails, return a formatted error response
            return res.json({
                isSpam: false,
                confidence: 0,
                reasons: ["Error processing the email content"],
                riskLevel: "low"
            });
        }
    } catch (error) {
        console.error("Error:", error);
        // Return a properly structured error response
        res.json({
            isSpam: false,
            confidence: 0,
            reasons: ["Server error occurred while processing the request"],
            riskLevel: "low"
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
