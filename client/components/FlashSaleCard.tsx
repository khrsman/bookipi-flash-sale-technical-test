'use client';

import { useState, useEffect } from 'react';
import { flashSaleAPI, FlashSaleStatus } from '@/services/api';
import CountdownTimer from './CountdownTimer';

const FlashSaleCard = () => {
  const [saleData, setSaleData] = useState<FlashSaleStatus | null>(null);
  const [userIdentifier, setUserIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="text-center text-gray-600">
          <div className="animate-pulse">Loading flash sale...</div>
        </div>
      </div>
    );
  }

  // Error State (No flash sale available)
  if (error || !saleData) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🛍️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'No Flash Sale Available'}
          </h2>
          <p className="text-gray-600 mb-4">
            There is currently no active flash sale. Please check back later!
          </p>
          <button
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetchStatus();
            }}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const { productName, status, stockRemaining, totalStock, startTime, endTime } = saleData;

  // Determine status color
  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-200 text-green-800';
      case 'upcoming':
        return 'bg-blue-200 text-blue-800';
      case 'sold_out':
        return 'bg-red-200 text-red-800';
      case 'ended':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
      {/* 1. Product Name */}
      <h1 className="text-3xl font-bold text-center mb-4">⚡ {productName}</h1>

      {/* 2. Status Badge */}
      <div className="text-center mb-4">
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor()}`}>
          {status.toUpperCase()}
        </span>
      </div>

      {/* 3. Stock Display */}
      <div className="text-center mb-4">
        <p className="text-lg">
          <span className="font-bold text-2xl">{stockRemaining}</span> items left
        </p>
        {stockRemaining < 20 && stockRemaining > 0 && (
          <p className="text-red-600 text-sm mt-1">Only {stockRemaining} left! Hurry up!</p>
        )}
      </div>

      {/* 4. Countdown Timer */}
      {status === 'upcoming' && <CountdownTimer targetTime={startTime} label="Sale starts in:" />}
      {status === 'active' && <CountdownTimer targetTime={endTime} label="Sale ends in:" />}

      {/* 5. User Input */}
      {status === 'active' && !hasPurchased && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter your email or username"
            value={userIdentifier}
            onChange={(e) => setUserIdentifier(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* 6. Purchase Button */}
      {status === 'active' && !hasPurchased && (
        <button
          onClick={handlePurchase}
          disabled={loading || stockRemaining === 0}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'BUY NOW'}
        </button>
      )}

      {/* 7. Message Display */}
      {message && (
        <div
          className={`mt-4 p-3 rounded-lg text-center ${
            message.includes('successful')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* 8. Purchase Confirmation */}
      {hasPurchased && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-center font-semibold">
          ✅ You have successfully purchased this item!
        </div>
      )}
    </div>
  );
};

export default FlashSaleCard;
