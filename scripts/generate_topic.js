
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function generateTopic() {
    console.log("🤖 Generating Friday ML Topic via Pollinations...");

    const prompt = `Generate a viral, futuristic topic for a machine learning "race" or competition visualization.
    Current Time: ${new Date().toISOString()}
    
    Return ONLY a valid JSON object with these fields:
    {
        "topic": "The catchy title",
        "description": "Short explanation",
        "competitors": [
            {"name": "Competitor 1", "color": "#hex"},
            {"name": "Competitor 2", "color": "#hex"},
            ... (5-7 total)
        ],
        "instagram_caption": "Viral IG caption",
        "facebook_caption": "Engaging FB caption",
        "threads_caption": "Short hook",
        "twitter_caption": "Tweet",
        "youtube_title": "YT Title",
        "youtube_description": "YT Description",
        "hashtags": "#ai #ml #tech"
    }
    Ensure the competitors fit the theme of the topic. No markdown.`;

    try {
        const apiKey = process.env.POLLINATIONS_API_KEY;
        if (!apiKey) throw new Error("POLLINATIONS_API_KEY not set in .env");

        const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || 'openai',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API failed: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        console.log("API Response (Shortened):", content.slice(0, 200));
        
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        
        const jsonStr = jsonMatch[0];
        const json = JSON.parse(jsonStr);

        const publicDir = path.join(__dirname, '../public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        fs.writeFileSync(path.join(__dirname, '../current_topic.json'), JSON.stringify(json, null, 2));
        fs.writeFileSync(path.join(publicDir, 'current_topic.json'), JSON.stringify(json, null, 2));
        console.log("✅ Topic generated and saved:", json.topic);
    } catch (e) {
        console.error("❌ Failed to generate topic:", e.message);
        console.error("💥 No fallback — pipeline will abort. Check API key / network.");
        throw e; // Fail hard — no silent fallback
    }
}

generateTopic();
