import React, { useEffect, useState } from 'react';
import { fetchAnalyticsData } from '../../services/api';

const AnalyticsPage: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await fetchAnalyticsData();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };
    loadAnalytics();
  }, []);

  return (
    <div>
      {analyticsData ? (
        <div>
          <h2>Analytics Overview</h2>
          {/* Render analytics data here */}
        </div>
      ) : (
        <p>Loading analytics...</p>
      )}
    </div>
  );
};

export default AnalyticsPage; 