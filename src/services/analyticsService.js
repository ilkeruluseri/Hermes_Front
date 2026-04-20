const BASE_URL = 'https://team-041.hackaton.sivas.edu.tr/api/v1/analytics';

export const fetchOnTimeRate = async (range = '7days') => {
  const response = await fetch(`${BASE_URL}/on-time-rate?range=${range}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
};

export const fetchCourierPerformance = async (range = 'week') => {
  const response = await fetch(`${BASE_URL}/courier-performance?range=${range}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
};

export const fetchKpis = async () => {
  const response = await fetch(`${BASE_URL}/kpis`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
};

export const fetchRecentDelays = async (limit = 10) => {
  const response = await fetch(`${BASE_URL}/recent-delays?limit=${limit}`);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
};
