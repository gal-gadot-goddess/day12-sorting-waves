
export const OPTIMIZER_THEMES: any = {
    'adam': {
        color: '#00ffaa',
        desc: "ADAM • Adaptive Moment",
        sound: 'sine'
    },
    'sgd': {
        color: '#ff3e3e',
        desc: "SGD • Stochastic Gradient",
        sound: 'sawtooth'
    },
    'rmsprop': {
        color: '#bc13fe',
        desc: "RMSProp • Gated Decay",
        sound: 'triangle'
    },
    'momentum': {
        color: '#ff8800',
        desc: "MOMENTUM • Inertia SEEK",
        sound: 'sine'
    },
    'adagrad': {
        color: '#00f3ff',
        desc: "ADAGRAD • Scaled Learning",
        sound: 'square'
    },
    'nadam': {
        color: '#ff00ff',
        desc: "NADAM • Nesterov Adam",
        sound: 'triangle'
    },
    'adafactor': {
        color: '#ffe600',
        desc: "ADAFACTOR • Scaling",
        sound: 'sine'
    }
};

export class MLEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    mlType: string;
    audioCtx: AudioContext;
    masterGain: GainNode;
    width: number;
    height: number;
    nodes: any[] = [];
    edges: any[] = [];
    isRunning: boolean = false;
    currentTheme: any;
    onComplete: () => void;
    animationId: number | null = null;

    constructor(canvas: HTMLCanvasElement, name: string, color: string, audioCtx: AudioContext, masterGain: GainNode, onComplete: () => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.mlType = name;
        this.audioCtx = audioCtx;
        this.masterGain = masterGain;
        this.width = canvas.width;
        this.height = canvas.height;
        this.onComplete = onComplete;
        
        // Dynamic theme based on AI data
        this.currentTheme = {
            color: color,
            desc: name.toUpperCase(),
            sound: this.getSoundForName(name)
        };
    }

    getSoundForName(name: string): string {
        const sounds = ['sine', 'triangle', 'square', 'sawtooth'];
        const index = name.length % sounds.length;
        return sounds[index];
    }

    playTone(freq: number) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        osc.type = this.currentTheme.sound;

        const vol = 0.005;
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.1);
    }

    createNode(id: number, x: number, y: number) {
        return {
            id, x, y,
            dist: Infinity, parent: null,
            visited: false, isStart: false, isEnd: false,
            activeColor: null, isPath: false
        };
    }

    generateNeuralMappedGraph() {
        this.nodes = [];
        this.edges = [];
        const nodeCount = 35;

        // Neural-style clustered generation
        // Neural-style clustered generation with fallback for small areas
        const attempts = 150; // More attempts
        for (let i = 0; i < attempts && this.nodes.length < nodeCount; i++) {
            let x = Math.random() * (Math.max(this.width, 100) - 40) + 20;
            let y = Math.random() * (Math.max(this.height, 40) - 20) + 10;

            let safe = true;
            for (let n of this.nodes) {
                if (Math.hypot(n.x - x, n.y - y) < 25) safe = false; // Closer nodes
            }
            if (safe) this.nodes.push(this.createNode(this.nodes.length, x, y));
        }

        if (this.nodes.length < 2) {
            // Emergency fallback nodes if generation failed
            this.nodes = [
                this.createNode(0, 50, this.height / 2),
                this.createNode(1, this.width - 50, this.height / 2)
            ];
        }

        this.nodes.sort((a, b) => a.x - b.x);
        this.nodes[0].isStart = true;
        this.nodes[this.nodes.length - 1].isEnd = true;

        // Connect "Neural Synapses"
        for (let i = 0; i < this.nodes.length; i++) {
            const current = this.nodes[i];
            // Guaranteed path sequential
            if (i < this.nodes.length - 1) {
                const next = this.nodes[i + 1];
                const d = Math.hypot(current.x - next.x, current.y - next.y);
                this.edges.push({ a: current, b: next, weight: d, active: false, isPath: false });
            }
            // Dense Brain Lattice
            for (let j = i + 2; j < this.nodes.length; j++) {
                const target = this.nodes[j];
                const d = Math.hypot(current.x - target.x, current.y - target.y);
                if (d < 150) {
                    this.edges.push({ a: current, b: target, weight: d, active: false, isPath: false });
                }
            }
        }
    }

    draw(time: number) {
        this.ctx.fillStyle = '#030303';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Edges (Synapses)
        this.edges.forEach(e => {
            let color = '#151515';
            let lineWidth = 1;
            let active = false;

            if (e.isPath) {
                color = '#fff'; lineWidth = 6; active = true;
                this.ctx.shadowColor = '#fff'; this.ctx.shadowBlur = 20;
            } else if (e.active) {
                color = this.currentTheme.color; lineWidth = 2; active = true;
                this.ctx.shadowColor = this.currentTheme.color; this.ctx.shadowBlur = 10;
            }

            const dist = Math.hypot(e.b.x - e.a.x, e.b.y - e.a.y);
            const angle = Math.atan2(e.b.y - e.a.y, e.b.x - e.a.x);

            this.ctx.save();
            this.ctx.translate(e.a.x, e.a.y);
            this.ctx.rotate(angle);
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);

            // Flowing Wave for active synapses
            const amp = active ? 4 : 0;
            const phase = -time * 0.01;
            for (let i = 0; i <= dist; i += 5) {
                let y = Math.sin(i * 0.06 + phase) * amp;
                this.ctx.lineTo(i, y);
            }

            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = lineWidth;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
            this.ctx.restore();
            this.ctx.shadowBlur = 0;
        });

        // Draw Nodes (Neurons)
        this.nodes.forEach(n => {
            this.ctx.save();
            this.ctx.translate(n.x, n.y);

            let color = '#222';
            let size = 4;
            let glow = 0;

            if (n.isStart) { color = '#fff'; size = 7; glow = 15; }
            else if (n.isEnd) { color = this.currentTheme.color; size = 7; glow = 15; }
            else if (n.isPath) { color = '#fff'; size = 8; glow = 25; }
            else if (n.visited) { color = this.currentTheme.color; size = 5; glow = 8; }

            if (glow > 0) {
                this.ctx.shadowBlur = glow + Math.sin(time / 200) * 3;
                this.ctx.shadowColor = (n.isPath || n.isStart) ? '#fff' : this.currentTheme.color;
            }

            this.ctx.beginPath();
            this.ctx.arc(0, 0, size, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = n.isPath ? '#fff' : '#000';
            this.ctx.stroke();
            this.ctx.restore();
        });

        // Overlay Title
        this.ctx.fillStyle = this.currentTheme.color;
        this.ctx.font = "bold 20px sans-serif";
        this.ctx.textAlign = "left";
        this.ctx.fillText(this.currentTheme.desc.split("•")[0], 10, 25);

        this.ctx.font = "8px monospace";
        this.ctx.globalAlpha = 0.4;
        this.ctx.fillText(`LOSS GRADIENT SEEKING // EP-12`, 10, 40);
        this.ctx.globalAlpha = 1.0;
    }

    startLoop() {
        const loop = () => {
            if (!this.isRunning) return;
            this.draw(Date.now());
            this.animationId = requestAnimationFrame(loop);
        };
        this.isRunning = true;
        loop();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    async runTraining() {
        this.generateNeuralMappedGraph();
        this.startLoop();

        const start = this.nodes[0];
        const end = this.nodes[this.nodes.length - 1];
        const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

        // Use a Weighted Search to simulate optimizer pathfinding
        start.dist = 0;
        let pQueue = [{ node: start, d: 0 }];

        while (pQueue.length && this.isRunning) {
            pQueue.sort((a, b) => a.d - b.d);
            let { node: u } = pQueue.shift()!;

            if (u.visited) continue;
            u.visited = true;
            if (u === end) break;

            this.playTone(300 + Math.random() * 200);
            await sleep(150); // Slower search

            for (let e of this.edges) {
                if (e.a !== u && e.b !== u) continue;
                let v = (e.a === u) ? e.b : e.a;
                if (!v.visited) {
                    // Random noise simulate stochastic gradient
                    let noise = Math.random() * 20;
                    let alt = u.dist + e.weight + noise;
                    if (alt < v.dist) {
                        v.dist = alt;
                        v.parent = u;
                        e.active = true;
                        pQueue.push({ node: v, d: alt });
                    }
                }
            }
        }

        // Highlight FINAL OPTIMAL PATH (White)
        let curr = end;
        let path = [];
        while (curr) {
            path.push(curr);
            curr = curr.parent;
            if (path.length > this.nodes.length) break;
        }
        path.reverse();

        if (path[0] === start) {
            for (let n of path) n.isPath = true;
            for (let i = 0; i < path.length - 1; i++) {
                const u = path[i];
                const v = path[i + 1];
                const edge = this.edges.find(e => (e.a === u && e.b === v) || (e.a === v && e.b === u));
                if (edge) {
                    edge.isPath = true;
                    this.playTone(880 + (i * 15));
                    await sleep(100); // Slower path highlight
                }
            }
        }

        await sleep(1000);
        this.onComplete();
    }
}
