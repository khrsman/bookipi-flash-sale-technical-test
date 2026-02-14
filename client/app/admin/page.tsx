'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { flashSaleAPI, adminAPI, CreateFlashSaleRequest, FlashSaleStatus } from '@/services/api';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [flashSales, setFlashSales] = useState<FlashSaleStatus[]>([]);
  const [totalPurchases, setTotalPurchases] = useState(0);

  // Form state
  const [formData, setFormData] = useState<CreateFlashSaleRequest>({
    productName: '',
    totalStock: 100,
    startTime: '',
    endTime: '',
  });

  // Load flash sales on mount
  useEffect(() => {
    loadFlashSales();
  }, []);

  // Load flash sales list
  const loadFlashSales = async () => {
    try {
      const response = await adminAPI.listFlashSales();
      if (response.data.success) {
        setFlashSales(response.data.data.flashSales);
        setTotalPurchases(response.data.data.totalPurchases);
      }
    } catch (error: any) {
      console.error('Error loading flash sales:', error);
      // Silently fail on initial load
    }
  };

  // Set default times (now + 1 minute for start, now + 60 minutes for end)
  const setDefaultTimes = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute from now
    const end = new Date(now.getTime() + 60 * 60 * 1000); // 60 minutes from now

    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData((prev) => ({
      ...prev,
      startTime: formatDateTime(start),
      endTime: formatDateTime(end),
    }));
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'totalStock' ? parseInt(value) || 0 : value,
    }));
  };

  // Handle create flash sale
  const handleCreateFlashSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await flashSaleAPI.createFlashSale({
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });

      if (response.data.success) {
        setMessage({ text: 'Flash sale created successfully!', type: 'success' });
        // Reset form
        setFormData({
          productName: '',
          totalStock: 100,
          startTime: '',
          endTime: '',
        });
        // Reload flash sales list
        loadFlashSales();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create flash sale';
      setMessage({
        text: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle reset all
  const handleResetAll = async () => {
    if (
      !confirm(
        'Are you sure you want to reset EVERYTHING? This will delete all flash sales, purchases, and flush Redis cache.'
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await adminAPI.resetAll();
      if (response.data.success) {
        setMessage({
          text: `All data reset successfully! ${response.data.data.flashSalesDeleted} flash sales and ${response.data.data.purchasesDeleted} purchases deleted.`,
          type: 'success',
        });
        // Reload flash sales list (should be empty now)
        loadFlashSales();
      }
    } catch (error: any) {
      setMessage({
        text: error.response?.data?.message || 'Failed to reset all data',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ended':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'sold_out':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen py-8 bg-gray-100">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Flash Sale
          </Link>
          <h1 className="text-4xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage flash sales and reset demo data</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Create Flash Sale */}
          <div className="space-y-6">
            {/* Create Flash Sale Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Create Flash Sale</h2>

              {/* Warning if flash sale already exists */}
              {flashSales.length > 0 && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>⚠️ Flash Sale Already Exists!</strong>
                    <br />
                    Only one flash sale is allowed at a time. Please reset all data first before
                    creating a new one.
                  </p>
                </div>
              )}

              <form onSubmit={handleCreateFlashSale} className="space-y-4">
                <div>
                  <label
                    htmlFor="productName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="productName"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    required
                    disabled={flashSales.length > 0}
                    placeholder="e.g., iPhone 15 Pro"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="totalStock"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Total Stock
                  </label>
                  <input
                    type="number"
                    id="totalStock"
                    name="totalStock"
                    value={formData.totalStock}
                    onChange={handleInputChange}
                    required
                    min="1"
                    disabled={flashSales.length > 0}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                      disabled={flashSales.length > 0}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endTime"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      required
                      disabled={flashSales.length > 0}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={setDefaultTimes}
                  disabled={flashSales.length > 0}
                  className="w-full px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Set Default Times (Start: +1min, End: +60min)
                </button>

                <button
                  type="submit"
                  disabled={loading || flashSales.length > 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading
                    ? 'Creating...'
                    : flashSales.length > 0
                      ? 'Reset Data First to Create'
                      : 'Create Flash Sale'}
                </button>
              </form>
            </div>

            {/* Reset Action */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Reset Demo Data</h2>
              <button
                onClick={handleResetAll}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset All Data (Database + Redis)'}
              </button>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This will permanently delete all flash sales, purchases,
                  and flush Redis cache.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Flash Sales List */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Flash Sales</h2>
                <button
                  onClick={loadFlashSales}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  🔄 Refresh
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Total Flash Sales</div>
                  <div className="text-2xl font-bold text-blue-800">{flashSales.length}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Total Purchases</div>
                  <div className="text-2xl font-bold text-green-800">{totalPurchases}</div>
                </div>
              </div>

              {/* Flash Sales List */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {flashSales.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg">No flash sales yet</p>
                    <p className="text-sm mt-2">Create a new flash sale to get started</p>
                  </div>
                ) : (
                  flashSales.map((sale) => (
                    <div
                      key={sale._id || sale.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 text-lg">{sale.productName}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            sale.status
                          )}`}
                        >
                          {sale.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Stock:</span>
                          <span className="font-medium text-gray-800">
                            {sale.stockRemaining ?? sale.totalStock} / {sale.totalStock}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">Start:</span>
                          <span className="font-medium text-gray-800">
                            {formatDate(sale.startTime)}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-gray-600">End:</span>
                          <span className="font-medium text-gray-800">
                            {formatDate(sale.endTime)}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                sale.totalStock > 0
                                  ? ((sale.totalStock - (sale.stockRemaining ?? sale.totalStock)) /
                                      sale.totalStock) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {sale.totalStock > 0
                            ? Math.round(
                                ((sale.totalStock - (sale.stockRemaining ?? sale.totalStock)) /
                                  sale.totalStock) *
                                  100
                              )
                            : 0}
                          % sold
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
