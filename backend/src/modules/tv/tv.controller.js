
import logger from "../../utils/logger.js";

// In-memory cache
let channelsCache = {
    data: null,
    timestamp: 0
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 mins

// Fallback / Default Channels
const FALLBACK_CHANNELS = [
    {
        name: "VTV1 HD (Dự phòng)",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/VTV1_Logo_2016.svg/1200px-VTV1_Logo_2016.svg.png",
        categories: ["News"],
        url: "https://vips-livecdn.fptplay.net/hda1/vtv1hd_vhls.smil/chunklist_b2500000.m3u8",
        is_fallback: true
    },
    {
        name: "VTV3 HD (Dự phòng)",
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/41/VTV3_Logo_2016.png",
        categories: ["Entertainment"],
        url: "https://vips-livecdn.fptplay.net/hda1/vtv3hd_vhls.smil/chunklist_b2500000.m3u8",
        is_fallback: true
    },
    {
        name: "HTV7 HD (Dự phòng)",
        logo: "https://upload.wikimedia.org/wikipedia/commons/e/e3/HTV7_Logo_2016.png",
        categories: ["General"],
        url: "https://live-ali2.tv360.vn/manifest/HTV7_HD/playlist.m3u8",
        is_fallback: true
    }
];

// Additional M3U Sources
const M3U_SOURCES = [
    "http://gg.gg/coocaa",
    "http://lienket.vn/beartv",
    "http://lienket.vn/vthanhtivi",
    "http://gg.gg/iptvbyvovanloc",
    "http://gg.gg/mytvbox1",
    // International Sources (iptv-org m3u)
    "https://iptv-org.github.io/iptv/index.m3u",
    // Special Categories
    "https://iptv-org.github.io/iptv/categories/animation.m3u",
    "https://iptv-org.github.io/iptv/categories/movies.m3u",
    "https://iptv-org.github.io/iptv/categories/sports.m3u"
];

// M3U Parser Helper
const parseM3U = (text) => {
    if (!text) return [];
    const lines = text.split('\n');
    const channels = [];
    let currentChannel = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
            // #EXTINF:-1 tvg-id="" tvg-name="" tvg-logo="" group-title="",Channel Name
            const info = line.substring(8);
            const commaIndex = info.lastIndexOf(',');
            const metadata = info.substring(0, commaIndex);
            
            // Extract Name
            const name = info.substring(commaIndex + 1).trim();

            // Extract Logo
            // Handle tvg-logo="url" or tvg-logo='url'
            const logoMatch = metadata.match(/tvg-logo=["'](.*?)["']/);
            const logo = logoMatch ? logoMatch[1] : null;

            // Extract Group
            const groupMatch = metadata.match(/group-title=["'](.*?)["']/);
            // Default group based on source or name if missing
            const group = groupMatch ? groupMatch[1] : "General";

            currentChannel = {
                name: name || "Unknown Channel",
                logo: logo,
                categories: [group],
                is_hd: name.toUpperCase().includes('HD')
            };
        } else if (line.startsWith('http')) {
            if (currentChannel.name) {
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = {}; // Reset
            }
        }
    }
    return channels;
};

import { EXTRA_SOURCES, isAllowedDomain } from "./tvSources.js";

// Helper: Resolve Redirects
const resolveRedirect = async (url) => {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3s max to resolve
        const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
        clearTimeout(timeout);
        return res.url;
    } catch (e) {
        return url; // Return original if fail
    }
};

// 1. Get Channels
export const getChannels = async (req, res) => {
    try {
        const now = Date.now();
        if (channelsCache.data && (now - channelsCache.timestamp < CACHE_DURATION)) {
            return res.json(channelsCache.data);
        }

        logger.info("Fetching IPTV channels from all sources...");
        
        // Parallel Async Fetch
        const fetchSource = async (url) => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout per source

                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) throw new Error(`Status ${response.status}`);
                
                const text = await response.text();
                
                // If it looks like JSON
                if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
                    try {
                        const json = JSON.parse(text);
                        if (Array.isArray(json)) {
                            return json.map(c => ({
                                name: c.name || c.channel,
                                logo: c.logo,
                                categories: c.categories || [],
                                url: c.url,
                                is_hd: true 
                            }));
                        }
                    } catch (e) { return []; }
                } 
                
                return parseM3U(text);

            } catch (err) {
                logger.warn(`Failed to fetch source: ${url} - ${err.message}`);
                return [];
            }
        };

        const promises = M3U_SOURCES.map(url => fetchSource(url));
        const results = await Promise.all(promises);
        
        // Resolve Extra Sources
        const resolvedExtras = await Promise.all(EXTRA_SOURCES.map(async (src) => {
            if (src.type === 'redirect') {
                const finalUrl = await resolveRedirect(src.url);
                
                // Validate final URL
                if (!isAllowedDomain(finalUrl) && !finalUrl.includes('.m3u8')) {
                    return null; 
                }
                
                return {
                    name: src.name,
                    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Tv_icon.svg/2048px-Tv_icon.svg.png", 
                    categories: src.categories,
                    url: finalUrl,
                    is_hd: true
                };
            }
            return src;
        }));

        // Flatten results
        let allChannels = [...FALLBACK_CHANNELS, ...resolvedExtras.filter(Boolean)];
        results.forEach(list => {
            if (Array.isArray(list)) allChannels.push(...list);
        });

        // Filter: Valid URL + Unique
        const seen = new Set();
        const uniqueChannels = [];
        
        for (const ch of allChannels) {
             if (!ch.url || !ch.url.startsWith('http')) continue;
             if (seen.has(ch.url)) continue;
             seen.add(ch.url);

             if (!ch.logo) ch.logo = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Tv_icon.svg/2048px-Tv_icon.svg.png";
             uniqueChannels.push(ch);
        }

        logger.info(`Total unique channels fetched: ${uniqueChannels.length}`);
        
        channelsCache = {
            data: uniqueChannels,
            timestamp: now
        };

        res.json(uniqueChannels);
    } catch (err) {
        logger.error("Get Channels Critical Error", err);
        res.json(FALLBACK_CHANNELS);
    }
};

// 2. Check Alive
export const checkStream = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        const response = await fetch(url, { 
            method: 'HEAD', 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);

        res.json({ alive: response.ok });
    } catch (err) {
        res.json({ alive: false });
    }
};

// 3. Proxy Stream (Simple Proxy)
export const proxyStream = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // Validate Domain (Basic check to avoid localhost access etc)
    try {
        const urlObj = new URL(url);
        if (['localhost', '127.0.0.1', '::1'].includes(urlObj.hostname)) {
             return res.status(403).json({ error: "Forbidden" });
        }
    } catch (e) {
        return res.status(400).json({ error: "Invalid URL" });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) return res.status(404).end();

        // Forward headers related to content
        const contentType = response.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        
        // Set CORS for frontend
        res.setHeader('Access-Control-Allow-Origin', '*');

        const buffer = await response.arrayBuffer();
        res.end(Buffer.from(buffer));

    } catch (err) {
        logger.error("Proxy Stream Error", err);
        res.status(500).end();
    }
};

export default {
    getChannels,
    checkStream,
    proxyStream
};
