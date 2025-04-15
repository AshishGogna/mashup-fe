'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSearch } from 'react-icons/fa';

interface Tag {
  tag: string;
  poster_url: string;
  count: number;
}

interface ApiResponse {
  tags: Tag[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_more: boolean;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

    const search = () => {
        console.log("search111*****");
        console.log(searchQuery);
        setCategories([]);
        setPage(1);
        fetchCategories(1, searchQuery);
    }

  const fetchCategories = useCallback(async (pageNum: number, searchQuery: string = '') => {
    try {
        console.log("search222*****");
        console.log(searchQuery);
        const params = new URLSearchParams();
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        params.append('page', pageNum.toString());
        const url = `http://192.168.18.96:8000/api/home/tags${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url);
      const data: ApiResponse = await response.json();
      
      if (data.tags) {
        setCategories(prev => pageNum === 0 ? data.tags : [...prev, ...data.tags]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(1);
  }, [fetchCategories]);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100 &&
      !isLoadingMore
    ) {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchCategories(nextPage);
    }
  }, [page, isLoadingMore, fetchCategories]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <div className="fixed top-4 left-1/2 -translate-x-[197px] z-[100]">
        <button
          onClick={() => router.back()}
          className="text-white hover:text-red-500 transition-colors bg-black/50 px-3 py-1 rounded-full"
        >
          ← tags
        </button>
      </div>

      {/* Search Bar */}
      <div className="fixed top-10 left-0 right-0 z-50">
        <div className="max-w-[424px] mx-auto px-4 py-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="search categories..."
              className="w-full bg-black/80 text-white px-4 py-2 rounded-full pl-5 pr-10 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm placeholder:text-sm"
            />
            <button
              onClick={() => search()}
            //   disabled={!searchQuery}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                searchQuery.trim()
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
                //   : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FaSearch className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="pt-24 pb-4 px-4">
        <div className="max-w-[414px] mx-auto mt-5">
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category, index) => (
              <div
                key={`${category.tag}-${index}`}
                className="aspect-square rounded-lg overflow-hidden relative group cursor-pointer"
                onClick={() => router.push(`/shorts?category=${encodeURIComponent(category.tag)}`)}
              >
                <img
                  src={category.poster_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  alt={category.tag}
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                  <span className="text-white text-sm font-medium">{category.tag}</span>
                  <span className="text-gray-300 text-xs">{category.count} videos</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Loading indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 