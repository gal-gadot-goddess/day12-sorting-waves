
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function generateTopic() {
    console.log("🤖 Generating Friday ML Topic via Pollinations...");

    const prompt = `Generate a viral, futuristic topic for a machine learning "race" or competition visualization.
    Fields: topic, description, instagram_caption, facebook_caption, threads_caption, twitter_caption, youtube_title, youtube_description, hashtags (space-separated string).
    Return ONLY a valid JSON object. No other text.`;

    try {
        const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=openai`);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API failed: ${response.status} - ${errText}`);
        }

        const content = await response.text();
        console.log("API Response (Shortened):", content.slice(0, 200));
        
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}') + 1;
        if (start === -1 || end === 0) throw new Error("No JSON found");
        
        const jsonStr = content.substring(start, end);
        const json = JSON.parse(jsonStr);

        fs.writeFileSync(path.join(__dirname, '../current_topic.json'), JSON.stringify(json, null, 2));
        console.log("✅ Topic generated:", json.topic);
    } catch (e) {
        console.error("❌ Failed to generate topic:", e.message);
        // Fallback
        const fallback = {
            "topic": "Neural Network Convergence Speedrun",
            "description": "Comparing training speeds of different architectures.",
            "instagram_caption": "🚀 Witness the ultimate AI speedrun! Who wins the convergence race? #AI #MachineLearning",
            "facebook_caption": "Neural networks competing for the fastest convergence. #TechTrends",
            "threads_caption": "Which AI architecture is truly the fastest? Let's find out. 🏎️",
            "twitter_caption": "The Great AI Race: CNN vs Transformer vs MLP. Who converges first? #AI #DataScience",
            "youtube_title": "Machine Learning Race: Neural Network Convergence Comparison",
            "youtube_description": "In this video, we visualize the training speed and convergence of various machine learning architectures.",
            "hashtags": "#ai #ml #machinelearning #datascience #tech"
        };
        fs.writeFileSync(path.join(__dirname, '../current_topic.json'), JSON.stringify(fallback, null, 2));
    }
}

generateTopic();
