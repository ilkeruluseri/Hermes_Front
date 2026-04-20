const delay = (ms = 400) => new Promise(res => setTimeout(res, ms));

export const fetchOnTimeRate = async () => {
  await delay();
  return [
    { day: 'Mon', rate: 91 },
    { day: 'Tue', rate: 88 },
    { day: 'Wed', rate: 94 },
    { day: 'Thu', rate: 87 },
    { day: 'Fri', rate: 96 },
    { day: 'Sat', rate: 93 },
    { day: 'Sun', rate: 90 },
  ];
};

export const fetchCourierPerformance = async () => {
  await delay();
  return [
    { name: 'Courier 1',  total: 38, onTime: 35 },
    { name: 'Courier 2',  total: 42, onTime: 39 },
    { name: 'Courier 3',  total: 31, onTime: 27 },
    { name: 'Courier 4',  total: 45, onTime: 44 },
    { name: 'Courier 5',  total: 29, onTime: 25 },
    { name: 'Courier 13', total: 36, onTime: 33 },
  ];
};

export const fetchKpis = async () => {
  await delay();
  return {
    totalDelivered:  { value: 1284, changePercent: 8 },
    onTimeRate:      { value: 91,   changePercent: 3 },
    activeDelays:    { value: 7,    changeFromYesterday: -2 },
    activeCouriers:  { value: 6,    changeFromYesterday: 0 },
  };
};

export const fetchRecentDelays = async () => {
  await delay();
  return [
    { trackingId: 'HRM-00412', courierName: 'Courier 3',  delayReason: 'Traffic congestion',    expectedEta: '+18 min' },
    { trackingId: 'HRM-00389', courierName: 'Courier 5',  delayReason: 'Address not found',     expectedEta: '+32 min' },
    { trackingId: 'HRM-00401', courierName: 'Courier 1',  delayReason: 'Customer unavailable',  expectedEta: '+12 min' },
    { trackingId: 'HRM-00374', courierName: 'Courier 2',  delayReason: 'Road closure',          expectedEta: '+25 min' },
    { trackingId: 'HRM-00458', courierName: 'Courier 13', delayReason: 'Vehicle breakdown',     expectedEta: '+47 min' },
    { trackingId: 'HRM-00421', courierName: 'Courier 4',  delayReason: 'High delivery volume',  expectedEta: '+9 min'  },
    { trackingId: 'HRM-00467', courierName: 'Courier 3',  delayReason: 'Weather conditions',    expectedEta: '+21 min' },
  ];
};
