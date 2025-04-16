'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AgeVerification() {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // localStorage.clear();
    
    const isVerified = localStorage.getItem('ageVerified');
    
    // If not verified and not on age-restricted page, show modal
    if (!isVerified && pathname !== '/age-restricted') {
      setShowModal(true);
    }
    
    // If verified is false and not on age-restricted page, redirect
    if (isVerified === 'false' && pathname !== '/age-restricted') {
      router.push('/age-restricted');
    }
  }, [pathname, router]);

  const handleYes = () => {
    localStorage.setItem('ageVerified', 'true');
    setShowModal(false);
  };

  const handleNo = () => {
    localStorage.setItem('ageVerified', 'false');
    setShowModal(false);
    router.push('/age-restricted');
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg max-w-md w-[70%] mx-4">
        <h2 className="text-2xl mb-4 text-center">age verification</h2>
        <p className="text-gray-700 mb-6 text-center">
          are you 18 years of age or older?
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleYes}
            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={handleNo}
            className="px-6 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
} 