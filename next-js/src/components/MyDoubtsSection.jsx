import React from 'react';
import { MessageCircle } from 'lucide-react';
import DoubtCard from './DoubtCard';

const MyDoubtsSection = ({ myDoubts, onViewAnswer }) => {
  return (
    <div>
      {myDoubts.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            You haven't asked any doubts yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {myDoubts.map((doubt) => (
            <DoubtCard
              key={doubt._id}
              doubt={doubt}
              type="my-doubts"
              onViewAnswer={(payload) => onViewAnswer?.(payload)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDoubtsSection;

