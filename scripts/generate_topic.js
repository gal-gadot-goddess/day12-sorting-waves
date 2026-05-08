
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

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
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API failed: ${response.status} - ${errText}`);
        }

        const content = await response.text();
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
        // Fallback
        const fallback = {
            "topic": "Neural Network Convergence Speedrun",
            "description": "Comparing training speeds of different architectures.",
            "competitors": [
                { "name": "ADAM", "color": "#00ffaa" },
                { "name": "SGD", "color": "#ff3e3e" },
                { "name": "RMSPROP", "color": "#bc13fe" }
            ],
            "instagram_caption": "🚀 Witness the ultimate AI speedrun! Who wins the convergence race? #AI #MachineLearning",
            "facebook_caption": "Neural networks competing for the fastest convergence. #TechTrends",
            "threads_caption": "Which AI architecture is truly the fastest? Let's find out. 🏎️",
            "twitter_caption": "The Great AI Race: CNN vs Transformer vs MLP. Who converges first? #AI #DataScience",
            "youtube_title": "Machine Learning Race: Neural Network Convergence Comparison",
            "youtube_description": "In this video, we visualize the training speed and convergence of various machine learning architectures.",
            "hashtags": "#ai #ml #machinelearning #datascience #tech"
        };
        
        const publicDir = path.join(__dirname, '../public');
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }
        
        fs.writeFileSync(path.join(__dirname, '../current_topic.json'), JSON.stringify(fallback, null, 2));
        fs.writeFileSync(path.join(publicDir, 'current_topic.json'), JSON.stringify(fallback, null, 2));
    }
}

generateTopic();
