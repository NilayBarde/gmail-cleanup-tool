import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export const checkAuthStatus = async () => {
    try {
        const response = await axios.get(`${API_URL}/auth/status`);
        return response.data.authenticated;
    } catch (error) {
        return false;
    }
};

export const login = async () => {
    // Triggers the OAuth flow - in a real app this would redirect
    // For our local tool, we might just open the auth URL if we had one,
    // but our backend auth is a bit manual (script based).
    // Let's assume for now we just hit the login endpoint which does... nothing useful for browser flow yet
    // actually, the user authenticated via the python script. 
    // So the browser just needs to know if it CAN make requests.
    return await checkAuthStatus();
};

export const fetchAnalysis = async (limit = 200) => {
    const response = await axios.get(`${API_URL}/emails/analyze?limit=${limit}`);
    return response.data;
};

export const fetchEmailIds = async (limit = 500) => {
    const response = await axios.get(`${API_URL}/emails/ids?limit=${limit}`);
    return response.data; // { ids: [...], count: ... }
};

export const fetchEmailDetailsBatch = async (ids) => {
    const response = await axios.post(`${API_URL}/emails/batch`, { ids });
    return response.data; // [ { id, sender, ... }, ... ]
};

export const deleteEmails = async (ids) => {
    const response = await axios.post(`${API_URL}/emails/delete`, { ids });
    return response.data;
};

export const unsubscribe = async (link) => {
    const response = await axios.post(`${API_URL}/emails/unsubscribe`, { unsubscribe_link: link });
    return response.data;
};
