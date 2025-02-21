import React from 'react';

interface EmailTemplate {
  id: string;
  title: string;
  performance: {
    openRate: number;
    clickRate: number;
    useCount: number;
  };
}

interface LeaderboardProps {
  templates: EmailTemplate[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ templates }) => {
  // Sort templates by performance (e.g., open rate)
  const sortedTemplates = [...templates].sort((a, b) => b.performance.openRate - a.performance.openRate);

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Top Performing Email Templates</h3>
      <ul className="divide-y divide-gray-200">
        {sortedTemplates.map((template, index) => (
          <li key={template.id} className="py-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">{index + 1}. {template.title}</p>
              <p className="text-sm text-gray-500">Open Rate: {template.performance.openRate}%</p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Click Rate: {template.performance.clickRate}%</p>
              <p>Use Count: {template.performance.useCount}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard; 