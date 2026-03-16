// config/cctvLocations.js
// Campus locations with GPS coordinates and CCTV camera details

export const CAMPUS_LOCATIONS = {
  main_gate: {
    id: 'main_gate',
    name: 'Main Gate',
    lat: 9.528700573372275,
    lng: 76.82343259954885,
    cctvCameras: [
      { id: 'cctv_mg_1', name: 'Main Gate Entrance', type: 'entry' },
      { id: 'cctv_mg_2', name: 'Main Gate Exit', type: 'exit' }
    ]
  },
  canteen: {
    id: 'canteen',
    name: 'Canteen',
    lat: 9.528312666270441,
    lng: 76.82135118602386,
    cctvCameras: [
      { id: 'cctv_ct_1', name: 'Canteen Entrance', type: 'entry' },
    ]
  },
  cc: {
    id: 'cc',
    name: 'Central Complex (CC)',
    lat: 9.527767987721617,
    lng: 76.82158489327396,
    cctvCameras: [
      { id: 'cctv_cc_1', name: 'CC Main Entrance', type: 'entry' },
    ]
  },
  rb_lawn: {
    id: 'rb_lawn',
    name: 'RB Lawn',
    lat: 9.52794786190133,
    lng: 76.82220180133518,
    cctvCameras: [
      { id: 'cctv_rb_1', name: 'RB Lawn North', type: 'outdoor' },
    ]
  },
  library: {
    id: 'library',
    name: 'Library',
    lat: 9.527796449495929,
    lng: 76.8219616331206,
    cctvCameras: [
      { id: 'cctv_lb_1', name: 'Library Entrance', type: 'entry' },
    ]
  },
  auditorium: {
    id: 'auditorium',
    name: 'Auditorium',
    lat: 9.528222319693706,
    lng: 76.82220155000242,
    cctvCameras: [
      { id: 'cctv_au_1', name: 'Auditorium Entrance', type: 'entry' },
      { id: 'cctv_au_2', name: 'Auditorium Stage', type: 'interior' }
    ]
  },
};

export const CAMPUS_CENTER = { lat: 9.5278, lng: 76.8216, zoom: 17 };

export const getLocationById = (id) => CAMPUS_LOCATIONS[id] || null;

export const getAllLocations = () => Object.values(CAMPUS_LOCATIONS);

export const getCCTVsByLocation = (locationId) => {
  const location = CAMPUS_LOCATIONS[locationId];
  return location ? location.cctvCameras : [];
};

export default CAMPUS_LOCATIONS;
