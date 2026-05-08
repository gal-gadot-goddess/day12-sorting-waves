
import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpeg from 'ffmpeg-static';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VIDEO_ONLY = path.join(__dirname, 'temp_video.mp4');
const AUDIO_ONLY = path.join(__dirname, 'temp_audio.webm');
const FINAL_OUTPUT = path.join(__dirname, 'day12_ml_race.mp4');

(async () => {
    console.log('🚀 Launching Algorithm Visualizer Capture Engine...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--window-size=1080,1920',
            '--autoplay-policy=no-user-gesture-required',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });

    page.on('console', msg => {
        const text = msg.text();
        if (!text.includes('[HMR]') && !text.includes('[WDS]')) {
            console.log(`[BROWSER] ${text}`);
        }
    });

    const audioChunks = [];
    await page.exposeFunction('sendAudioChunk', (base64) => {
        audioChunks.push(Buffer.from(base64, 'base64'));
    });

    const targetUrl = 'http://localhost:3012';
    console.log(`📡 Navigating to ${targetUrl}...`);
    // Increase timeout for safe loading
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('🎙️ Injecting Audio & Video Sync Logic...');
    await page.evaluate(() => {
        window.startAudioCapture = () => {
            const audioCtx = window.audioCtx;
            const masterGain = window.masterGain;

            console.log(`[AUDIO] Context: ${!!audioCtx}, MasterGain: ${!!masterGain}`);

            if (!audioCtx || !masterGain) {
                console.error('Browser audio components not found. Waiting...');
                return false;
            }

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const dest = audioCtx.createMediaStreamDestination();
            masterGain.connect(dest);

            const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm' });
            recorder.ondataavailable = async (e) => {
                if (e.data.size > 0) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const base64 = reader.result.split(',')[1];
                        window.sendAudioChunk(base64);
                    };
                    reader.readAsDataURL(e.data);
                }
            };
            recorder.start(100); // Small chunks
            window._audioRecorder = recorder;
            console.log('Browser audio recording active');
            return true;
        };
    });

    const videoRecorder = new PuppeteerScreenRecorder(page, {
        fps: 60,
        videoFrame: { width: 1080, height: 1920 },
        videoBitrate: 8000,
        audio: false // We handle audio separately
    });

    // Short wait to ensure app is mounted and audioCtx is ready
    await new Promise(r => setTimeout(r, 2000));

    // Try to start audio capture
    console.log('🎙️ Starting synchronised capture and race...');

    // Start Recorder FIRST (Silence initially)
    await videoRecorder.start(VIDEO_ONLY);

    // Start Audio Capture Loop
    const audioStarted = await page.evaluate(async () => {
        // First start the race (which resumes AudioContext)
        if (window.startRace) {
            await window.startRace();
        }
        // Then loop the audio
        return window.startAudioCapture ? window.startAudioCapture() : false;
    });

    if (!audioStarted) {
        console.warn('⚠️ Audio capture failed to start immediately.');
    }

    console.log('⏳ Recording in progress...');

    // Find stop condition
    try {
        await page.waitForFunction(() => window.isSortingCompleted === true, { timeout: 120000 }); // 2 min max for race
    } catch (e) {
        console.error('Timeout waiting for completion signal.');
    }

    console.log('✨ Visulization found! Capturing finale...');
    await new Promise(r => setTimeout(r, 3000)); // 3s buffer for final path enjoyment

    console.log('🛑 Stopping...');
    await videoRecorder.stop();
    await page.evaluate(() => {
        if (window._audioRecorder && window._audioRecorder.state !== 'inactive') {
            window._audioRecorder.stop();
        }
    });

    await new Promise(r => setTimeout(r, 2000)); // Wait for last chunks

    await browser.close();

    if (audioChunks.length > 0) {
        fs.writeFileSync(AUDIO_ONLY, Buffer.concat(audioChunks));
        console.log(`🎬 Merging with FFmpeg... Audio Size: ${Buffer.concat(audioChunks).length} bytes`);
        try {
            // Merge audio and video. AAC for audio, copy video.
            // Check if ffmpeg-static gives the path or we need to use 'ffmpeg' from path
            const ffmpegPath = ffmpeg || 'ffmpeg';
            execSync(`"${ffmpegPath}" -y -i "${VIDEO_ONLY}" -i "${AUDIO_ONLY}" -c:v copy -c:a aac -b:a 192k -shortest "${FINAL_OUTPUT}"`);
            console.log(`✅ COMPLETE! Saved to: ${FINAL_OUTPUT}`);

            // Extract thumbnail from 10s mark
            const THUMBNAIL_PATH = path.join(__dirname, 'thumbnail.jpg');
            console.log('🖼️  Extracting thumbnail from 10s mark...');
            try {
                execSync(`"${ffmpegPath}" -y -ss 00:00:10 -i "${FINAL_OUTPUT}" -vframes 1 -q:v 2 "${THUMBNAIL_PATH}"`);
                console.log(`✅ Thumbnail saved to: ${THUMBNAIL_PATH}`);
            } catch (thumbErr) {
                console.warn('⚠️ Thumbnail extraction failed, but video is saved.');
            }

            // Clean up temps
            if (fs.existsSync(VIDEO_ONLY)) fs.unlinkSync(VIDEO_ONLY);
            if (fs.existsSync(AUDIO_ONLY)) fs.unlinkSync(AUDIO_ONLY);

        } catch (e) {
            console.error('Merge failed:', e.message);
            // If merge failed, at least save video
            if (fs.existsSync(VIDEO_ONLY)) {
                fs.copyFileSync(VIDEO_ONLY, FINAL_OUTPUT);
                console.log('Saved video only due to merge error.');
            }
        }
    } else {
        console.error('❌ No audio captured!');
        if (fs.existsSync(VIDEO_ONLY)) {
            fs.renameSync(VIDEO_ONLY, FINAL_OUTPUT);
        }
    }
})();
