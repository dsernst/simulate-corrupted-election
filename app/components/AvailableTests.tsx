export const AvailableTests = () => {
  return (
    <div className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Available Tests</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center">
          <span className="font-medium w-8">A:</span>
          <span className="text-gray-600">Quick but less reliable</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium w-8">B:</span>
          <span className="text-gray-600">Balanced cost and reliability</span>
        </div>
        <div className="flex items-center">
          <span className="font-medium w-8">C:</span>
          <span className="text-gray-600">
            Most expensive but perfect accuracy
          </span>
        </div>
      </div>
    </div>
  )
}
