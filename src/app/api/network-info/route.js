import { NextResponse } from 'next/server';
import { networkInterfaces } from 'os';

export async function GET() {
    try {
        const nets = networkInterfaces();
        const results = {};

        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Ignorer les adresses non-IPv4 et les adresses internes
                if (net.family === 'IPv4' && !net.internal) {
                    if (!results[name]) {
                        results[name] = [];
                    }
                    results[name].push(net.address);
                }
            }
        }

        // Trouver l'IP la plus probable (généralement 192.168.x.x ou 10.x.x.x)
        let localIP = 'localhost';

        for (const interfaceName of Object.keys(results)) {
            for (const ip of results[interfaceName]) {
                if (ip.startsWith('192.168.') || ip.startsWith('10.')) {
                    localIP = ip;
                    break;
                }
            }
            if (localIP !== 'localhost') break;
        }

        return NextResponse.json({
            success: true,
            localIP,
            allInterfaces: results,
            isDevelopment: process.env.NODE_ENV === 'development'
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des informations réseau:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            localIP: 'localhost'
        }, { status: 500 });
    }
} 