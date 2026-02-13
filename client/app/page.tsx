import FlashSaleCard from '@/components/FlashSaleCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">⚡ Flash Sale System</h1>
          <p className="text-gray-600">High-throughput MERN stack flash sale platform</p>
        </div>

        {/* Flash Sale Card */}
        <FlashSaleCard />
      </div>
    </div>
  );
}
