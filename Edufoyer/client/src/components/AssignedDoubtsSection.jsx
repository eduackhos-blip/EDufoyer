import React from 'react';
import { Clock } from 'lucide-react';
import DoubtCard from './DoubtCard';

const AssignedDoubtsSection = ({ assignedDoubts, onJoinSession }) => {
  return (
    <div>
      {assignedDoubts.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No assigned doubts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {assignedDoubts.map((doubt) => (
            <DoubtCard
              key={doubt._id}
              doubt={doubt}
              type="assigned"
              onJoinSession={(id) => onJoinSession?.(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedDoubtsSection;

