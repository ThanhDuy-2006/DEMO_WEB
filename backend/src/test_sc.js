import axios from 'axios';
(async () => {
    try {
        const query = 'sontung';
        const SC_CLIENT_ID = 'u2ydppvwXCUxV6VITwH4OXk8JBySpoNr'
        const response = await axios.get(`https://api-v2.soundcloud.com/search/tracks`, {
            params: {
                q: query,
                client_id: SC_CLIENT_ID,
                limit: 5
            }
        });
        console.log("Total tracks:", response.data.collection?.length);
        if (response.data.collection?.length > 0) {
            console.log("First track:", response.data.collection[0].title);
        } else {
            console.log("No tracks found.");
        }
    } catch (error) {
        console.error("ERROR STAT:", error.response?.status);
        console.error("ERROR DATA:", error.response?.data);
    }
})();
