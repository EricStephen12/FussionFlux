import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
    </div>
  );
} 