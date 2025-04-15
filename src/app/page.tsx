'use client';

import { FaVideo, FaFilm, FaSearch, FaHome, FaBolt } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTypewriter } from '@/hooks/useTypewriter';

interface Tag {
  tag: string;
  poster_url: string;
  count: number;
}

interface Video {
  _id: string;
  url: string;
}

const EXAMPLE_PROMPTS = [
  "happy ending after massage",
  "indian girl giving a blowjob",
  "hentai",
  "cum shot after sex",
  "search for your fantasy...",
];

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Tag[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const placeholderText = useTypewriter(EXAMPLE_PROMPTS);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/shorts?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    // Fetch categories
    fetch('http://192.168.18.96:8000/api/home/tags')
      .then(res => res.json())
      .then(data => {
        if (data.tags) {
          setCategories(data.tags);
        }
      })
      .catch(err => console.error('Error fetching categories:', err));

    // Fetch videos
    fetch('http://192.168.18.96:8000/api/home/scenes')
      .then(res => res.json())
      .then(data => {
        if (data.videos) {
          setVideos(data.videos);
        }
      })
      .catch(err => console.error('Error fetching videos:', err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Search Bar */}
      <div className="flex justify-center bg-black">
        <div className="w-full md:max-w-[414px] px-4 mt-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholderText}
              className="w-full bg-black/80 text-white px-4 py-2 pl-5 pr-12 rounded-full border border-gray-700 focus:outline-none focus:border-red-500 placeholder-gray-500"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                searchQuery.trim()
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FaSearch className="text-sm" />
            </button>
          </div>
          <p className="text-gray-400 opacity-50 text-xs text-left mt-2">AI powered search</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center bg-black">
        <div className="w-full md:max-w-[414px] overflow-y-auto">

          {/* Categories Section */}
          <div className="px-4 mt-10">
            <div className="flex items-center justify-between mt-10">
              <div className="flex items-center gap-2">
                <h1 className="text-white text-xl">tags</h1>
              </div>
              <button 
                onClick={() => router.push('/categories')}
                className="text-white hover:text-red-500 transition-colors text-xs"
              >
                {"see All >"}
              </button>
            </div>
            <div className="overflow-x-auto whitespace-nowrap mt-3">
              <div className="inline-flex flex-col gap-3">
                {/* First Row */}
                <div className="inline-flex gap-3">
                  {categories.slice(0, 10).map((category, index) => (
                    <div 
                      key={index} 
                      className="w-[100px] h-[100px] rounded-lg overflow-hidden relative group cursor-pointer"
                      onClick={() => router.push(`/shorts?category=${encodeURIComponent(category.tag)}`)}
                    >
                      <img
                        src={category.poster_url}
                        className="absolute inset-0 w-full h-full object-cover"
                        alt={category.tag}
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                        <span className="text-white text-sm font-medium">{category.tag}</span>
                        {/* <span className="text-gray-300 text-xs">{category.count}</span> */}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Second Row */}
                <div className="inline-flex gap-3">
                  {categories.slice(10, 20).map((category, index) => (
                    <div 
                      key={index + 10} 
                      className="w-[100px] h-[100px] rounded-lg overflow-hidden relative group cursor-pointer"
                      onClick={() => router.push(`/shorts?category=${encodeURIComponent(category.tag)}`)}
                    >
                      <img
                        src={category.poster_url}
                        className="absolute inset-0 w-full h-full object-cover"
                        alt={category.tag}
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                        <span className="text-white text-sm font-medium">{category.tag}</span>
                        {/* <span className="text-gray-300 text-xs">{category.count}</span> */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="p-4">
            <div className="flex items-center justify-between mt-10">
              <div className="flex items-center gap-2">
                <h1 className="text-white text-xl">clips</h1>
                <FaBolt className="text-xl text-white" />
              </div>
              <button 
                onClick={() => router.push('/shorts')}
                className="text-white hover:text-red-500 transition-colors text-xs"
              >
                {"see All >"}
              </button>
            </div>
            <p className="text-gray-300 opacity-80 text-sm">pick and watch your favorite scenes 👅</p>
          </div>

          {/* Horizontal Scrollable Videos */}
          <div className="overflow-x-auto whitespace-nowrap pb-4 px-4">
            <div className="inline-flex gap-4">
              {videos.map((video) => (
                <div 
                  key={video._id} 
                  className="w-[220px] h-[300px] rounded-lg overflow-hidden bg-gray-800 relative cursor-pointer"
                  onClick={() => router.push(`/shorts?id=${video._id}`)}
                >
                  <video
                    src={video.url}
                    className="absolute inset-0 w-full h-full object-cover"
                    playsInline
                    muted
                    loop
                    autoPlay={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
