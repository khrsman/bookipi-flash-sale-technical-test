import FlashSaleCard from '@/components/FlashSaleCard';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen py-4 sm:py-8 bg-gray-100">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            ⚡ Flash Sale System
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            High-throughput MERN stack flash sale platform
          </p>
          <div className="mt-4">
            <Link
              href="/admin"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        </div>

        {/* Flash Sale Card */}
        <FlashSaleCard />
      </div>
    </div>
  );
}
