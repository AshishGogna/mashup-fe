'use client';

import { FaVideo, FaFilm, FaSearch, FaHome, FaBolt } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Tag {
  tag: string;
  poster_url: string;
  count: number;
}

interface Video {
  _id: string;
  url: string;
}

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Tag[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

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
        <div className="w-full md:max-w-[414px] px-4 py-10">
          <div className="relative">
            <input
              type="text"
              placeholder="Search videos..."
              className="w-full bg-black/80 text-white px-4 py-2 pl-10 rounded-full border border-gray-700 focus:outline-none focus:border-red-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex justify-center bg-black">
        <div className="w-full md:max-w-[414px] overflow-y-auto">

          {/* Categories Section */}
          <div className="px-4 mb-4">
            <h2 className="text-white text-lg font-bold mb-3">Categories</h2>
            <div className="overflow-x-auto whitespace-nowrap">
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
                <h1 className="text-white text-xl font-bold">Scenes</h1>
                <FaBolt className="text-xl text-white" />
              </div>
              <button 
                onClick={() => router.push('/shorts')}
                className="text-white hover:text-red-500 transition-colors text-sm"
              >
                {"See All >"}
              </button>
            </div>
            <p className="text-gray-300 opacity-80 text-sm">Watch only those scenes that you want to watch 👅</p>
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
