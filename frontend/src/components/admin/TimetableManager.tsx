import React from 'react';
import TimetableDashboard from '../timetable/TimetableDashboard';

export default function TimetableManager() {
  return <TtDashboardContainer />;
}

function TtDashboardContainer() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <TimetableDashboard />
    </div>
  );
}