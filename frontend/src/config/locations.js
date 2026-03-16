// Campus locations for missing person reports
export const CAMPUS_LOCATIONS = [
  { id: 'main_gate', name: 'Main Gate' },
  { id: 'canteen', name: 'Canteen' },
  { id: 'cc', name: 'Central Complex (CC)' },
  { id: 'rb_lawn', name: 'RB Lawn' },
  { id: 'library', name: 'Library' },
  { id: 'auditorium', name: 'Auditorium' },
  { id: 'sports', name: 'Sports Complex' },
  { id: 'hostel_a', name: 'Hostel Block A' },
  { id: 'hostel_b', name: 'Hostel Block B' },
  { id: 'parking', name: 'Parking Area' },
];

export const getLocationName = (id) => {
  const location = CAMPUS_LOCATIONS.find(l => l.id === id);
  return location ? location.name : id;
};

export default CAMPUS_LOCATIONS;
