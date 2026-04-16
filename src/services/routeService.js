export const fetchFullRoute = async () => {
  try {
    const response = await fetch('https://team-041.hackaton.sivas.edu.tr/api/v1/full-route', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch route data:', error);
    throw error;
  }
};
