
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MLEngine } from './services/MLEngine';

const MODELS = ['adam', 'sgd', 'rmsprop', 'momentum', 'adagrad', 'nadam', 'adafactor'];

const MLRow = ({ model, audioCtx, masterGain, isRaceStarted, onComplete }: { key?: string, model: string, audioCtx: AudioContext, masterGain: GainNode, isRaceStarted: boolean, onComplete: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<MLEngine | null>(null);
    const hasStarted = useRef(false);

    useEffect(() => {
        if (canvasRef.current && audioCtx && masterGain && isRaceStarted && !hasStarted.current) {
            hasStarted.current = true;

            const parent = canvasRef.current.parentElement;
            if (parent) {
                canvasRef.current.width = parent.clientWidth || 1080;
                canvasRef.current.height = Math.max(parent.clientHeight, 100);
            }

            const engine = new MLEngine(canvasRef.current, model, audioCtx, masterGain, onComplete);
            engineRef.current = engine;

            const delay = MODELS.indexOf(model) * 200;
            setTimeout(() => {
                engine.runTraining();
            }, delay);

            return () => {
                engine.stop();
            };
        }
    }, [model, audioCtx, masterGain, isRaceStarted, onComplete]);

    return (
        <div className="flex-1 w-full relative border-b border-white/5" style={{ minHeight: 0 }}>
            <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
    );
};

const App: React.FC = () => {
    const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
    const [masterGain, setMasterGain] = useState<GainNode | null>(null);
    const [completedCount, setCompletedCount] = useState(0);
    const [isRaceStarted, setIsRaceStarted] = useState(false);
    const [topic, setTopic] = useState("NEURAL TRAINING RACE");

    const handleComplete = useCallback(() => {
        setCompletedCount(prev => prev + 1);
    }, []);

    useEffect(() => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        (window as any).isSortingCompleted = false;
        (window as any).audioCtx = ctx;
        (window as any).masterGain = gain;

        (window as any).startRace = async () => {
            if (ctx.state === 'suspended') await ctx.resume();
            setIsRaceStarted(true);
            return true;
        };

        setAudioCtx(ctx);
        setMasterGain(gain);

        // Load dynamic topic if exists
        fetch('./current_topic.json').then(r => r.json()).then(data => {
            if (data.topic) setTopic(data.topic.toUpperCase());
        }).catch(() => { });

        return () => { ctx.close(); }
    }, []);

    useEffect(() => {
        if (completedCount >= MODELS.length) {
            (window as any).isSortingCompleted = true;
        }
    }, [completedCount]);

    return (
        <div className="flex flex-col h-screen w-full bg-[#030303] overflow-hidden px-12 py-32 font-sans">
            <div className="flex flex-col h-full w-full max-w-[90%] mx-auto gap-12">
                <div className="flex flex-col items-center justify-center shrink-0">
                    <h1 className="text-5xl font-black bg-gradient-to-r from-red-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent tracking-tighter text-center leading-none uppercase">
                        {topic}
                    </h1>
                    <p className="text-[12px] text-white/40 mt-4 font-mono tracking-[0.8em] uppercase">Day 12 // Optimizier Convergence</p>
                </div>

                <div className="flex-1 flex flex-col gap-2 w-full mx-auto border border-white/5 relative min-h-0 rounded-[2rem] overflow-hidden glass-effect">
                    {audioCtx && masterGain && MODELS.map(model => (
                        <MLRow key={model} model={model} audioCtx={audioCtx} masterGain={masterGain} isRaceStarted={isRaceStarted} onComplete={handleComplete} />
                    ))}
                </div>
            </div>

            <style>{`
                .glass-effect {
                    background: rgba(255, 255, 255, 0.015);
                    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(12px);
                }
            `}</style>
        </div>
    );
};

export default App;
