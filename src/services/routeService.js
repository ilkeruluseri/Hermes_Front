export const requestBody = {
  "depot_latitude": 39.75,
  "depot_longitude": 37.015,
  "date": "2026-04-19",
  "assignments": [
    { "courier_id": 1, "stop_pool_ids": [1, 2, 3, 4, 5] },
    { "courier_id": 2, "stop_pool_ids": [6, 7, 8, 9, 10] }
  ]
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

export const saveRouteResult = async (optimizedRoute, depotLat, depotLon) => {
  const baseUrl = 'https://team-041.hackaton.sivas.edu.tr/api/v1';

  const response = await fetch(`${baseUrl}/routes/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      depot_latitude: depotLat,
      depot_longitude: depotLon,
      stops: optimizedRoute.map(s => ({
        original_stop_id: s.stop_id,
        stop_name: s.stop_name,
        latitude: s.latitude,
        longitude: s.longitude,
        sequence: s.optimized_position,
        vehicle_id: s.vehicle_id,
        time_window_slack_min: s.time_window_slack_min
      }))
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to save route: ${response.status}`);
  }

  return response.json();
};

export const completeStopRequest = async (stopId, actualDelayMin = null) => {
  // Adjust the base URL to match your API domain
  const baseUrl = 'https://team-041.hackaton.sivas.edu.tr/api/v1';

  const response = await fetch(`${baseUrl}/stops/${stopId}/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}` // Add if your endpoint is protected
    },
    body: JSON.stringify({ actual_delay_min: actualDelayMin }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to complete stop: ${response.status}`);
  }

  return response.json();
};
