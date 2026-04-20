export const requestBody = {
  "depot_latitude": 39.75,
  "depot_longitude": 37.015,
  "date": "2026-04-19",
  "assignments": [
    { "courier_id": 1, "stop_pool_ids": [1, 2, 3, 4, 5] },
    { "courier_id": 2, "stop_pool_ids": [6, 7, 8, 9, 10] },
    { "courier_id": 13, "stop_pool_ids": [32, 31, 33, 38] }
  ],
  "demo_mode": true,
}

export const fetchAutoDispatch = async () => {
  try {
    const response = await fetch('https://team-041.hackaton.sivas.edu.tr/api/v1/auto-dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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


export const fetchCouriers = async () => {
  const baseUrl = 'https://team-041.hackaton.sivas.edu.tr/api/v1';
  const response = await fetch(`${baseUrl}/couriers`);
  if (!response.ok) throw new Error(`Failed to fetch couriers: ${response.status}`);
  return response.json();
};

export const completeStopRequest = async (stopId, actualDelayMin = null) => {
  const baseUrl = 'https://team-041.hackaton.sivas.edu.tr/api/v1';

  const response = await fetch(`${baseUrl}/stops/${stopId}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ actual_delay_min: actualDelayMin }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to complete stop: ${response.status}`);
  }

  return response.json();
};

export const postSuggestionDecision = async (routeId, suggestionId, action) => {
  const baseUrl = 'https://team-041.hackaton.sivas.edu.tr/api/v1';

  const response = await fetch(`${baseUrl}/routes/${routeId}/suggestion/${suggestionId}/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to make decision: ${response.status}`);
  }

  return response.json();
};
