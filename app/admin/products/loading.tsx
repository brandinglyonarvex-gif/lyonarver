export default function Loading() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded-lg w-64 mt-2 animate-pulse"></div>
        </div>
        <div className="h-12 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
      </div>

      <div className="mb-6">
        <div className="h-12 bg-gray-200 rounded-lg w-full animate-pulse"></div>
      </div>

      <div className="hidden md:block bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                {[...Array(5)].map((_, index) => (
                  <th key={index} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-40 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="h-6 bg-gray-200 rounded-lg w-40 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div>
                <div className="h-4 bg-gray-200 rounded-lg w-16 mb-2 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-200 rounded-lg w-12 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
  );
}