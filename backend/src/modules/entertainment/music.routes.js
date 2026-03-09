import express from 'express';
import axios from 'axios';
import qs from 'qs';
import { ZingMp3 } from 'zingmp3-api-full';

const router = express.Router();

let spotifyToken = null;
let tokenExpirationTime = null;

// Replace with your own Spotify Developer App Credentials
// You can create an app here: https://developer.spotify.com/dashboard/
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

/**
 * Gets or refreshes a Spotify Access Token using Client Credentials Flow
 */
const getSpotifyToken = async () => {
    // Return token if valid
    if (spotifyToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
        return spotifyToken;
    }

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            qs.stringify({ grant_type: 'client_credentials' }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
                }
            }
        );

        spotifyToken = response.data.access_token;
        // Expire 5 minutes early to be safe
        tokenExpirationTime = Date.now() + (response.data.expires_in * 1000) - (5 * 60 * 1000); 
        console.log('[Spotify Auth] Successfully fetched new API Token');
        return spotifyToken;
    } catch (error) {
        console.error('[Spotify Auth Error]', error.response?.data || error.message);
        throw new Error('Failed to fetch Spotify Token');
    }
};

/**
 * Spotify Secure API Search route
 * Usage: /api/entertainment/music/spotify/search?q=sontung
 */
router.get('/spotify/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: "Query parameter 'q' is required" });
        }

        const token = await getSpotifyToken();

        const response = await axios.get(`https://api.spotify.com/v1/search`, {
            params: {
                q: query,
                type: 'track,playlist',
                limit: 10
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("[Spotify Search Internal Error]", error.response?.data || error.message);
        const status = error.response?.status || 500;
        const msg = error.response?.data?.error?.message || "Failed to search Spotify";
        res.status(status).json({ error: msg });
    }
});

/**
 * Spotify Track Details route
 * Usage: /api/entertainment/music/spotify/track/:id
 */
router.get('/spotify/track/:id', async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ error: "Track ID is required" });
        }

        const token = await getSpotifyToken();

        const response = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error(`[Spotify Track Internal Error] ID: ${req.params.id}`, error.response?.data || error.message);
        const status = error.response?.status || 500;
        const msg = error.response?.data?.error?.message || "Failed to get track details";
        res.status(status).json({ error: msg });
    }
});
/**
 * SoundCloud Search route
 * Usage: /api/entertainment/music/soundcloud/search?q=sontung
 */
router.get('/soundcloud/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: "Query parameter 'q' is required" });
        }

        // A fresh working SoundCloud client_id extracted via browser
        const SC_CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID; 

        const response = await axios.get(`https://api-v2.soundcloud.com/search/tracks`, {
            params: {
                q: query,
                client_id: SC_CLIENT_ID,
                limit: 15
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("[SoundCloud Search Error Detailed]", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to search SoundCloud", details: error.response?.data || error.message });
    }
});
// ----------------------------------------------------
// ZING MP3 ROUTES (ORIGINAL)
// ----------------------------------------------------

// Search Song
// Usage: /api/entertainment/music/search?q=sontung
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: "Query parameter 'q' is required" });
        }
        
        const data = await ZingMp3.search(query);
        res.json(data);
    } catch (error) {
        console.error("[Music Search Error]", error);
        res.status(500).json({ error: "Failed to search music" });
    }
});

// Get Song Stream URL
// Usage: /api/entertainment/music/song?id=ZW79ZBE8
router.get('/song', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ error: "ID parameter is required" });
        }
        
        const data = await ZingMp3.getSong(id);
        res.json(data);
    } catch (error) {
        console.error("[Get Song Error]", error);
        res.status(500).json({ error: "Failed to get song stream" });
    }
});

// Get Home Playlists (can use for initial load)
// Usage: /api/entertainment/music/home
router.get('/home', async (req, res) => {
    try {
        const data = await ZingMp3.getHome();
        res.json(data);
    } catch (error) {
        console.error("[Get Home Error]", error);
        res.status(500).json({ error: "Failed to get home data" });
    }
});

// Get Detail Playlist
// Usage: /api/entertainment/music/playlist?id=ZWZB969E
router.get('/playlist', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ error: "ID parameter is required" });
        }
        
        const data = await ZingMp3.getDetailPlaylist(id);
        res.json(data);
    } catch (error) {
        console.error("[Get Playlist Error]", error);
        res.status(500).json({ error: "Failed to get playlist details" });
    }
});

// Get Top 100
// Usage: /api/entertainment/music/top100
router.get('/top100', async (req, res) => {
    try {
        const data = await ZingMp3.getTop100();
        res.json(data);
    } catch (error) {
        console.error("[Get Top 100 Error]", error);
        res.status(500).json({ error: "Failed to get top 100" });
    }
});

// ----------------------------------------------------
// YOUTUBE MUSIC ROUTES
// ----------------------------------------------------

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * YouTube Music Search
 */
router.get('/youtube/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: "Query parameter 'q' is required" });
        }

        const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                q: query,
                part: 'snippet',
                maxResults: 20,
                type: 'video',
                videoCategoryId: '10', // Music
                regionCode: 'VN',
                key: YOUTUBE_API_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const errorData = error.response?.data?.error || error.message;
        console.error("[YouTube Search Error]", status, errorData);
        res.status(status).json({ 
            error: "YouTube Search API Error", 
            details: typeof errorData === 'object' ? errorData.message : errorData 
        });
    }
});

/**
 * YouTube Music Trending
 */
router.get('/youtube/trending', async (req, res) => {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                part: 'snippet,contentDetails,statistics',
                chart: 'mostPopular',
                regionCode: req.query.region || 'VN',
                videoCategoryId: '10', // Music
                maxResults: 20,
                key: YOUTUBE_API_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        const status = error.response?.status || 500;
        const errorData = error.response?.data?.error || error.message;
        console.error("[YouTube Trending Error]", status, errorData);
        res.status(status).json({ 
            error: "YouTube Trending API Error", 
            details: typeof errorData === 'object' ? errorData.message : errorData 
        });
    }
});

/**
 * YouTube Video Details
 */
router.get('/youtube/videos/:id', async (req, res) => {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                part: 'snippet,contentDetails',
                id: req.params.id,
                key: YOUTUBE_API_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("[YouTube Details Error]", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch video details" });
    }
});

export default router;
