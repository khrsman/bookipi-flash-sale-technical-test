import CountdownTimer from '@/components/CountdownTimer';

export default function Home() {
  // Set target time to 24 hours from now for demo
  const targetTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">Flash Sale System</h1>
          <p className="text-gray-600">High-throughput MERN stack flash sale platform</p>
        </div>

        {/* Demo Card */}
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-3xl font-bold text-center mb-4">Countdown Timer</h2>

          <div className="mb-6">
            <CountdownTimer targetTime={targetTime} label="Sale starts in:" />
          </div>

          <div className="text-center text-gray-600 text-sm">
            <p className="mb-2">✅ Countdown Timer Component Created</p>
            <p className="mb-2">✅ Real-time updates every second</p>
            <p className="mb-2">✅ Proper cleanup on unmount</p>
            <p>✅ Tailwind CSS styling applied</p>
          </div>
        </div>
      </div>
    </div>
  );
}
