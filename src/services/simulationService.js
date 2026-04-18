const API_BASE = 'https://team-041.hackaton.sivas.edu.tr';

export const simulationService = {
    start: async (payload) => {
        const response = await fetch(`${API_BASE}/api/v1/simulation/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to start simulation: ${error.detail || response.statusText}`);
        }

        return response.json();
    },

    next: async () => {
        const response = await fetch(`${API_BASE}/api/v1/simulation/next`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to advance simulation: ${error.detail || response.statusText}`);
        }

        return response.json();
    },

    stop: async () => {
        const response = await fetch(`${API_BASE}/api/v1/simulation/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to stop simulation: ${error.detail || response.statusText}`);
        }

        return response.json();
    }
};
