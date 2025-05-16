// public/deleteWorker.js
const deleteCabana = async (url, token) => {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

self.onmessage = async (e) => {
  const result = await deleteCabana(e.data.url, e.data.token);
  self.postMessage(result);
};