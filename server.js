const http = require('http');
const express = require('express');
const compression = require('compression');
const path = require('path');

// We dynamically import the ES module Delaford class after transpilation
async function main() {
    const app = express();

    app.use(compression());
    app.use(express.json());

    // Serve static frontend in production
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, 'dist')));
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'dist', 'index.html'));
        });
    } else {
        app.get('/', (req, res) => res.send('Delaford Game Server - Development Mode'));
    }

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', players: 0, uptime: process.uptime() });
    });

    const PORT = process.env.PORT || 6500;
    const server = http.createServer(app);

    // Dynamically require the built server (CommonJS after babel transpile)
    const { Delaford } = require('./build/Delaford.js');
    const game = new Delaford(server);

    server.listen(PORT, () => {
        console.log(`[Server] Delaford listening on port ${PORT}`);
        console.log(`[Server] WebSocket: ws://localhost:${PORT}`);
        console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    });

    process.on('SIGTERM', () => {
        console.log('[Server] SIGTERM received, shutting down...');
        game.stop();
        server.close();
    });
}

main().catch(console.error);
