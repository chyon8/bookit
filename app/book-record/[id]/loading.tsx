
const Loading = () => {
  return (
    <div className="bg-light-gray dark:bg-dark-bg min-h-screen animate-pulse">
      {/* Skeleton for RecordHeader */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-dark-card p-4 shadow-sm flex items-center justify-between h-14">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex items-center space-x-2">
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>

      {/* Skeleton for Hero Section */}
      <div className="pt-14 relative h-64 overflow-hidden p-4">
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-lg"></div>
        </div>
        <div className="relative z-[1] flex h-full flex-col items-center justify-center text-white">
          <div className="h-36 w-24 bg-gray-300 dark:bg-gray-600 rounded-md shadow-lg"></div>
          <div className="mt-3 h-6 w-3/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="mt-1 h-4 w-1/2 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>

      {/* Skeleton for Description Section */}
      <div className="p-4 -mt-6 relative z-[2]">
        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg">
          <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Skeleton for Form Section */}
      <div className="p-4 space-y-8 -mt-10 relative z-[2]">
        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg">
          <div className="flex space-x-1">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-6">
          <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
            <div>
              <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>

          <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>

          <div className="flex items-center mt-4">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded border"></div>
            <div className="ml-2 h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-4">
          <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl shadow-lg space-y-4">
          <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
