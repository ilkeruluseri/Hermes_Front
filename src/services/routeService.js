export const requestBody = {
  "stops": [
    {
      "stop_sequence": 1,
      "stop_id": "s1",
      "stop_name": "Cumhuriyet Üniversitesi Şubesi",
      "latitude": 39.7200,
      "longitude": 37.0200,
      "cumulative_delay_min": 0.0,
      "prev_stop_delay_min": 0.0,
      "time_window_slack_min": 45.0,
      "hist_slack_min": 40.0,
      "hist_delay_probability": 0.2,
      "traffic_level": "moderate",
      "road_type": "urban",
      "weather_condition": "clear",
      "hour_of_day": 10,
      "day_of_week": 1
    },
    {
      "stop_sequence": 2,
      "stop_id": "s2",
      "stop_name": "Paşabahçe Dağıtım Noktası",
      "latitude": 39.7550,
      "longitude": 37.0200,
      "cumulative_delay_min": 8.0,
      "prev_stop_delay_min": 8.0,
      "time_window_slack_min": 20.0,
      "hist_slack_min": 25.0,
      "hist_delay_probability": 0.55,
      "traffic_level": "high",
      "road_type": "urban",
      "weather_condition": "rain",
      "hour_of_day": 10,
      "day_of_week": 1
    },
    {
      "stop_sequence": 3,
      "stop_id": "s3",
      "stop_name": "Organize Sanayi Merkezi",
      "latitude": 39.7400,
      "longitude": 36.9500,
      "cumulative_delay_min": 15.0,
      "prev_stop_delay_min": 7.0,
      "time_window_slack_min": 60.0,
      "hist_slack_min": 55.0,
      "hist_delay_probability": 0.15,
      "traffic_level": "low",
      "road_type": "highway",
      "weather_condition": "clear",
      "hour_of_day": 10,
      "day_of_week": 1
    }
  ],
  "depot_latitude": 39.7500,
  "depot_longitude": 37.0150,
  "use_p90": false,
  "num_vehicles": 2,
  "time_limit_seconds": 10,
  "generate_explanation": true
}

export const fetchFullRoute = async () => {
  try {
    const response = await fetch('https://team-041.hackaton.sivas.edu.tr/api/v1/full-route', {
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
