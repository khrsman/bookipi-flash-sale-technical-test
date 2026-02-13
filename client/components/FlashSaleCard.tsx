'use client';

import { useState, useEffect } from 'react';
import { flashSaleAPI, FlashSaleStatus } from '@/services/api';
import moment from 'moment';

const FlashSaleCard = () => {
  const [saleData, setSaleData] = useState<FlashSaleStatus | null>(null);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Initialize userIdentifier from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedIdentifier = localStorage.getItem('userIdentifier') || '';
      setUserIdentifier(savedIdentifier);
    }
  }, []);

  // EFFECT 1: Polling for status updates
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // EFFECT 2: Check existing purchase
  useEffect(() => {
    if (userIdentifier) {
      checkExistingPurchase();
    }
  }, [userIdentifier]);

  // EFFECT 3: Update countdown timer
  useEffect(() => {
    if (!saleData) return;

    const updateTimer = () => {
      const now = moment();
      const target = moment(saleData.status === 'upcoming' ? saleData.startTime : saleData.endTime);
      const diff = target.diff(now);

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const duration = moment.duration(diff);
      const days = Math.floor(duration.asDays());
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      if (days > 0) {
        setTimeLeft(
          `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      } else {
        setTimeLeft(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [saleData]);

  const fetchStatus = async () => {
    try {
      const response = await flashSaleAPI.getStatus();
      setSaleData(response.data.data);
      setError(null);
      setIsLoading(false);
    } catch (error: any) {
      // Handle 404 as "no flash sale available"
      if (error.response?.status === 404) {
        setError('No flash sale available at the moment');
      } else {
        setError('Failed to load flash sale data');
      }
      setIsLoading(false);
      console.error('Error fetching status:', error);
    }
  };

  const checkExistingPurchase = async () => {
    try {
      const response = await flashSaleAPI.checkPurchase(userIdentifier);
      setHasPurchased(response.data.data.hasPurchased);
    } catch (error) {
      console.error('Error checking purchase:', error);
    }
  };

  const handlePurchase = async () => {
    // Validate userIdentifier not empty
    if (!userIdentifier.trim()) {
      setMessage('Please enter your email or username');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await flashSaleAPI.attemptPurchase(userIdentifier);

      if (response.data.success) {
        setHasPurchased(true);
        // Save userIdentifier to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('userIdentifier', userIdentifier);
        }
      }

      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8">
        <div className="text-center text-gray-600">
          <div className="animate-pulse text-sm sm:text-base">Loading flash sale...</div>
        </div>
      </div>
    );
  }

  // Error State (No flash sale available)
  if (error || !saleData) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-6 sm:p-8">
        <div className="text-center">
          <div className="text-5xl sm:text-6xl mb-4">🛍️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
            {error || 'No Flash Sale Available'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            There is currently no active flash sale. Please check back later!
          </p>
          <button
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetchStatus();
            }}
            className="px-5 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:scale-105"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const { productName, status, stockRemaining, totalStock } = saleData;

  // Determine status color and style
  const getStatusStyle = () => {
    switch (status) {
      case 'active':
        return {
          badge: 'bg-green-500 text-white shadow-lg animate-pulse',
          card: 'bg-green-50',
        };
      case 'upcoming':
        return {
          badge: 'bg-blue-500 text-white shadow-lg animate-pulse',
          card: 'bg-blue-50',
        };
      case 'sold_out':
        return {
          badge: 'bg-red-500 text-white shadow-lg',
          card: 'bg-red-50',
        };
      case 'ended':
        return {
          badge: 'bg-gray-500 text-white shadow-lg',
          card: 'bg-gray-100',
        };
      default:
        return {
          badge: 'bg-gray-200 text-gray-800',
          card: 'bg-gray-100',
        };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <div
      className={`max-w-md mx-auto ${statusStyle.card} rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-4 sm:p-6 md:p-8 border border-gray-200 sm:border-2`}
    >
      {/* 1. Product Name */}
      <div className="text-center mb-3 sm:mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{productName}</h1>
      </div>

      {/* 2. Status Badge with Timer */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="inline-flex flex-col items-center gap-2">
          <span
            className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider ${statusStyle.badge}`}
          >
            {status.toUpperCase()}
          </span>
          {(status === 'active' || status === 'upcoming') && (
            <div className="flex items-center gap-2 text-gray-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-semibold font-mono">{timeLeft}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Stock Display with progress bar */}
      {status === 'active' && (
        <div className="mb-4 sm:mb-6 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                Items Sold
              </p>
              <p className="text-lg sm:text-xl font-bold text-green-600">
                {totalStock - stockRemaining} / {totalStock}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-6 sm:h-8 overflow-hidden shadow-inner relative">
              <div
                className="bg-orange-600 h-full transition-all duration-500 ease-out"
                style={{ width: `${((totalStock - stockRemaining) / totalStock) * 100}%` }}
              ></div>
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-green-600 text-xs sm:text-sm font-bold px-2 pointer-events-none select-none"
                style={{ zIndex: 2 }}
              >
                {Math.round(((totalStock - stockRemaining) / totalStock) * 100)} %
              </span>
            </div>
          </div>

          {/* Low stock warning */}
          {stockRemaining < 20 && stockRemaining > 0 && (
            <div className="mt-3 sm:mt-4 bg-red-50 border-2 border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-bold text-xs sm:text-sm">
                  Only {stockRemaining} left! Hurry up!
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* 4. User Input with modern styling */}
      {status === 'active' && !hasPurchased && (
        <div className="mt-4 sm:mt-6 mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Your Email or Username
          </label>
          <input
            type="text"
            placeholder="Enter your email or username"
            value={userIdentifier}
            onChange={(e) => setUserIdentifier(e.target.value)}
            className="w-full px-3 sm:px-5 py-2 sm:py-3 text-sm sm:text-base bg-white/80 backdrop-blur-sm border-2 border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400 shadow-md"
          />
        </div>
      )}

      {/* 5. Purchase Button */}
      {status === 'active' && !hasPurchased && (
        <button
          onClick={handlePurchase}
          disabled={loading || stockRemaining === 0}
          className="w-full bg-green-600 hover:bg-red-700 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 transform"
        >
          <span className="flex items-center justify-center gap-1 sm:gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm sm:text-base">Processing...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="text-sm sm:text-base">BUY NOW</span>
              </>
            )}
          </span>
        </button>
      )}

      {/* 6. Message Display */}
      {message && (
        <div
          className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg sm:rounded-xl text-center text-sm sm:text-base font-semibold shadow-lg border-2 ${
            message.includes('successful')
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-red-100 text-red-800 border-red-300'
          }`}
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {message.includes('successful') ? (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span>{message}</span>
          </div>
        </div>
      )}

      {/* 7. Purchase Confirmation */}
      {hasPurchased && (
        <div className="mt-3 sm:mt-4 p-4 sm:p-5 bg-green-500 text-white rounded-lg sm:rounded-xl text-center font-bold shadow-lg sm:shadow-xl border-2 border-green-400 animate-pulse">
          <div className="flex items-center justify-center gap-2 text-base sm:text-lg">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm sm:text-base">Purchase Successful!</span>
            <span className="text-xl sm:text-2xl">🎉</span>
          </div>
          <p className="text-xs sm:text-sm mt-2 text-green-100">Thank you for your purchase!</p>
        </div>
      )}
    </div>
  );
};

export default FlashSaleCard;
