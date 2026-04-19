const requestBody = {
  "stops": [
    {
      "stop_sequence": 1,
      "stop_name": "Cumhuriyet Üniversitesi Şubesi",
      "latitude": 39.7150,
      "longitude": 37.0350,
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
      "stop_name": "Paşabahçe Dağıtım Noktası",
      "latitude": 39.7850,
      "longitude": 37.0300,
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
  "num_vehicles": 1,
  "time_limit_seconds": 10,
  "generate_explanation": true
}

const BASE_URL = 'https://team-041.hackaton.sivas.edu.tr/api/v1';

export const fetchFullRoute = async () => {
  try {
    const routeRes = await fetch(`${BASE_URL}/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courier_id: 1,
        dispatcher_id: 1,
        date: new Date().toISOString(),
        depot_latitude: 41.015,
        depot_longitude: 28.979
      })
    });

    if (!routeRes.ok) throw new Error(`Routes API error: ${routeRes.status}`);
    const routeData = await routeRes.json();
    console.log('[DEBUG] route created:', routeData);
    const route_id = routeData.id;

    const response = await fetch(`${BASE_URL}/full-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...requestBody, route_id }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('[DEBUG] full-route error body:', errBody);
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch route data:', error);
    throw error;
  }
};
