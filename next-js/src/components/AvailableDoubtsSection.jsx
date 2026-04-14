import React from 'react';
import { CheckCircle } from 'lucide-react';
import DoubtCard from './DoubtCard';

const AvailableDoubtsSection = ({ availableDoubts, onAcceptDoubt }) => {
  return (
    <div>
      {availableDoubts.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No available doubts matching your skills.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {availableDoubts.map((doubt) => (
            <DoubtCard
              key={doubt._id}
              doubt={doubt}
              type="available"
              onAcceptDoubt={onAcceptDoubt}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableDoubtsSection;

