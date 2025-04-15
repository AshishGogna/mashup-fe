'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { FaSync } from 'react-icons/fa';

interface Video {
  id: string;
  url: string;
  source_id: string;
  tags: string[];
  scenes?: { start: number; name: string }[];
}

// Add remote logging utility
const logToServer = async (level: 'info' | 'error', message: string, data?: any) => {
  console.log(`[${level}] ${message}`, data);
};

export default function ShortsPage() {
  const searchParams = useSearchParams();
  const initialVideoId = searchParams.get('id');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const [videos, setVideos] = useState<Video[]>([]);
  const [downloadedVideos, setDownloadedVideos] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneListRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const currentIndex = useRef(0);
  const lastSwipeTime = useRef(0);
  const SWIPE_COOLDOWN = 500; // 500ms cooldown between swipes
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch videos from API
    fetchVideos();
  }, []);

  const formatSceneTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Add video loading state tracking
  useEffect(() => {
    const currentVideo = videos[currentIndex.current];
    if (currentVideo) {
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement) {
        const handleLoadStart = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);
        const handleError = () => setIsLoading(false);

        videoElement.addEventListener('loadstart', handleLoadStart);
        videoElement.addEventListener('canplay', handleCanPlay);
        videoElement.addEventListener('error', handleError);

        return () => {
          videoElement.removeEventListener('loadstart', handleLoadStart);
          videoElement.removeEventListener('canplay', handleCanPlay);
          videoElement.removeEventListener('error', handleError);
        };
      }
    }
  }, [videos, currentIndex.current]);

  const refreshVideos = () => {
    setVideos([])
    currentIndex.current = 0
    fetchVideos()
  }

  const fetchVideos = async (more: boolean = false) => {
    const params = new URLSearchParams();
    if (more) {
      params.append('last_id', videos[videos.length - 1].id);
      if (category) {
        params.append('category', category);
      } else if (search) {
        params.append('search', search);
      }
    } else {
      if (initialVideoId) {
        params.append('with_id', initialVideoId);
      } else if (category) {
        params.append('category', category);
      } else if (search) {
        params.append('search', search);
      }
    }

    setIsLoading(true);
    const url = `http://192.168.18.96:8000/api/scenes${params.toString() ? `?${params.toString()}` : ''}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.videos) {
          setVideos(prevVideos => {
            // Create a map of existing video IDs for deduplication
            const existingIds = new Set(prevVideos.map(v => v.id));
            
            // Filter out videos that are already in the list
            const newVideos = data.videos
              .filter((video: any) => !existingIds.has(video._id))
              .map((video: any) => ({
                id: video._id,
                url: video.url,
                source_id: video.source_id || 'unknown',
                tags: video.tags || [],
                scenes: video.scenes || []
              }));
            
            console.log("New videos: ", newVideos);
            // Append new videos to the existing list
            return [...prevVideos, ...newVideos];
          });
        }
      })
      .catch(err => {
        console.error('Error fetching videos:', err);
        logToServer('error', 'Failed to fetch videos', { error: err });
      })
      .finally(() => {
        setIsLoading(false);
    });
  };

  const pauseAllVideosExcept = (currentVideoId: string) => {
    Object.entries(videoRefs.current).forEach(([id, video]) => {
      if (video)
        if (id !== currentVideoId) {
            video.pause();
        } else {
            video.play();
        }
    });
  };

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (container) {
      const targetScroll = index * window.innerHeight;
      const currentVideo = videos[index];
      console.log('Now playing video:', {
        id: currentVideo.id,
        sourceId: currentVideo.source_id,
        url: currentVideo.url,
        index: index,
        isDownloaded: !!downloadedVideos[currentVideo.id],
        isDownloading: !!isDownloading[currentVideo.id]
      });
      logToServer('info', 'Scrolling to index', {
        index,
        targetScroll,
        currentScroll: container.scrollTop,
        videoId: currentVideo.id,
        sourceId: currentVideo.source_id
      });
      
      // Pause all videos except the current one
      pauseAllVideosExcept(currentVideo.id);
      
      // Reset duration and current time for the new video
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement) {
        // Reset seek bar data
        setDuration(videoElement.duration);
        setCurrentTime(0);
        videoElement.currentTime = 0;
        setIsSeeking(false);
      }
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });

      console.log("Index: ", index, "/", videos.length);
      if (index == videos.length - 3) {
        console.log("Fetch more!");
        fetchVideos(true);
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Handle wheel events (desktop)
      const handleWheel = (e: WheelEvent) => {
        if (isInsideHorizontallyScrollable(e.target)) return;
        e.preventDefault();
        const now = Date.now();
        
        if (now - lastSwipeTime.current > SWIPE_COOLDOWN) {
          const deltaY = e.deltaY;
          const velocity = Math.abs(deltaY);

          if (velocity > 50) {
            logToServer('info', 'Wheel swipe detected', {
              deltaY,
              velocity,
              currentIndex: currentIndex.current,
              direction: deltaY > 0 ? 'down' : 'up'
            });

            if (deltaY > 0 && currentIndex.current < videos.length - 1) {
              currentIndex.current++;
              scrollToIndex(currentIndex.current);
            } else if (deltaY < 0 && currentIndex.current > 0) {
              currentIndex.current--;
              scrollToIndex(currentIndex.current);
            }
            lastSwipeTime.current = now;
          }
        }
      };

      const isInsideHorizontallyScrollable = (el: EventTarget | null): boolean => {
        if (!(el instanceof HTMLElement)) return false;
      
        let current = el;
        while (current && current !== containerRef.current) {
          if (
            current.classList.contains('horizontal-scroll') ||
            current.scrollWidth > current.clientWidth
          ) {
            return true;
          }
          current = current.parentElement!;
        }
        return false;
      };

      // Handle touch events (mobile)
      const handleTouchStart = (e: TouchEvent) => {
        // Check if touch is on seek bar or scene list
        const target = e.target as HTMLElement;
        if (target.closest('.seek-bar') || target.closest('.scene-list')) {
          return; // Allow default behavior for seek bar and scene list
        }
        
        if (isInsideHorizontallyScrollable(e.target)) return;
        e.preventDefault();
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();
        logToServer('info', 'Touch started', {
          startY: touchStartY.current,
          startTime: touchStartTime.current
        });
      };

      const handleTouchMove = (e: TouchEvent) => {
        // Check if touch is on seek bar or scene list
        const target = e.target as HTMLElement;
        if (target.closest('.seek-bar') || target.closest('.scene-list')) {
          return; // Allow default behavior for seek bar and scene list
        }
        
        e.preventDefault();
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY.current - currentY;
        logToServer('info', 'Touch moving', {
          currentY,
          deltaY,
          velocity: Math.abs(deltaY / (Date.now() - touchStartTime.current))
        });
      };

      const handleTouchEnd = (e: TouchEvent) => {
        // Check if touch is on seek bar or scene list
        const target = e.target as HTMLElement;
        if (target.closest('.seek-bar') || target.closest('.scene-list')) {
          return; // Allow default behavior for seek bar and scene list
        }
        
        e.preventDefault();
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        
        const deltaY = touchStartY.current - touchEndY;
        const deltaTime = touchEndTime - touchStartTime.current;
        const velocity = Math.abs(deltaY / deltaTime);

        logToServer('info', 'Touch ended', {
          endY: touchEndY,
          deltaY,
          deltaTime,
          velocity,
          currentIndex: currentIndex.current,
          cooldown: touchEndTime - lastSwipeTime.current,
          direction: deltaY > 0 ? 'down' : 'up'
        });

        if (touchEndTime - lastSwipeTime.current > SWIPE_COOLDOWN && velocity > 0.3 && Math.abs(deltaY) > 50) {
          logToServer('info', 'Swipe detected', {
            direction: deltaY > 0 ? 'down' : 'up',
            velocity,
            deltaY,
            currentIndex: currentIndex.current
          });

          if (deltaY > 0 && currentIndex.current < videos.length - 1) {
            currentIndex.current++;
            scrollToIndex(currentIndex.current);
          } else if (deltaY < 0 && currentIndex.current > 0) {
            currentIndex.current--;
            scrollToIndex(currentIndex.current);
          }
          lastSwipeTime.current = touchEndTime;
        }
      };

      // Add all event listeners
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [videos]);

  // Add video progress tracking
  useEffect(() => {
    const currentVideo = videos[currentIndex.current];
    if (currentVideo) {
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement) {
        const updateProgress = () => {
          if (!isSeeking) {
            setCurrentTime(videoElement.currentTime);
          }
        };
        
        const updateDuration = () => {
          setDuration(videoElement.duration);
        };

        videoElement.addEventListener('timeupdate', updateProgress);
        videoElement.addEventListener('loadedmetadata', updateDuration);
        
        return () => {
          videoElement.removeEventListener('timeupdate', updateProgress);
          videoElement.removeEventListener('loadedmetadata', updateDuration);
        };
      }
    }
  }, [videos, currentIndex.current, isSeeking]);

  const handleSeekStart = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsSeeking(true);
    const currentVideo = videos[currentIndex.current];
    if (currentVideo) {
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement) {
        videoElement.pause();
      }
    }
  };

  const handleSeekEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    const currentVideo = videos[currentIndex.current];
    if (currentVideo) {
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement) {
        videoElement.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    const currentVideo = videos[currentIndex.current];
    if (currentVideo) {
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement) {
        videoElement.currentTime = newTime;
      }
    }
  };

  // Add touch move handler for seek bar
  const handleSeekTouchMove = (e: React.TouchEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent the touch event from bubbling up
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const touch = e.touches[0];
    const percentage = (touch.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, percentage * duration));
    
    // Update both the input value and current time
    target.value = newTime.toString();
    setCurrentTime(newTime);
    
    const currentVideo = videos[currentIndex.current];
    if (currentVideo) {
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement) {
        videoElement.currentTime = newTime;
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const backButtonText = () => {
    if (category) {
      return `← ${category}`;
    } else if (search) {
      return `← ${search}`;
    } else {
        return "← back"
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center">
      {/* Back Button */}
      <div className="fixed top-4 left-1/2 -translate-x-[197px] z-[100]">
        <button
          onClick={() => router.back()}
          className="text-white hover:text-red-500 transition-colors bg-black/50 px-3 py-1 rounded-full"
        >
          {backButtonText()}
        </button>
      </div>

      {/* Refresh Button */}
      <div className="fixed top-4 right-1/2 translate-x-[197px] z-[100]">
        <button
          onClick={() => refreshVideos()}
          className={`text-white transition-colors bg-black/50 p-2 rounded-full ${!isLoading ? 'hover:text-red-500' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaSync className="text-sm" />
          )}
        </button>
      </div>

      <div 
        ref={containerRef}
        className="w-full md:max-w-[414px] h-[100dvh] overflow-y-scroll snap-y snap-mandatory bg-black relative"
      >
        {videos.map((video) => (
          <div
            key={video.id}
            className="relative w-full h-[100dvh] snap-start flex items-center justify-center"
            style={{ height: '100dvh' }}
          >
            <video
              ref={el => {
                if (el) {
                  videoRefs.current[video.id] = el;
                }
              }}
              className="w-full max-h-full object-contain"
              style={{ height: '100%', width: '100%' }}
              src={video.url}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            />

            {/* Scene List */}
            <div 
              ref={sceneListRef}
              className="absolute bottom-30 left-0 right-0 px-4 z-20 scene-list"
              style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              <div 
                className="flex gap-6"
                style={{
                  minWidth: 'max-content',
                  padding: '8px 0'
                }}
              >
                {video.scenes && video.scenes.map((scene, index) => {
                  const isCurrentScene = currentTime >= scene.start && 
                    (!video.scenes?.[index + 1] || currentTime < video.scenes[index + 1].start);
                  
                  return (
                    <span 
                      key={index}
                      className={`text-xs whitespace-nowrap cursor-pointer flex-shrink-0 ${
                        isCurrentScene ? 'text-red-500 font-medium' : 'text-white underline'
                      }`}
                      onClick={() => {
                        const videoElement = videoRefs.current[video.id];
                        if (videoElement) {
                          videoElement.currentTime = scene.start;
                        }
                      }}
                    >
                      {scene.action} at {formatSceneTime(scene.start)}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Custom Seekbar */}
            <div 
              className="absolute bottom-10 left-0 right-0 px-4 z-20 seek-bar"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="text-white text-xs">{formatTime(currentTime)}</span>
                <div className="flex-1 relative h-20">
                  <div 
                    className="absolute h-1 bg-gray-600 rounded-full w-full"
                    style={{ top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <div 
                    className="absolute h-1 bg-red-500 rounded-full"
                    style={{ 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      width: `${(currentTime / duration) * 100}%` 
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}
                    onMouseDown={handleSeekStart}
                    onMouseUp={handleSeekEnd}
                    onTouchStart={handleSeekStart}
                    onTouchEnd={handleSeekEnd}
                    onTouchMove={handleSeekTouchMove}
                    className="absolute w-full h-full opacity-0 cursor-pointer touch-none"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <span className="text-white text-xs">{formatTime(duration)}</span>
              </div>
            </div>

            {/* <div className="absolute bottom-4 left-4 right-4 text-white z-10">
              <div className="flex flex-wrap gap-2 overflow-x-auto">
                {video.tags?.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-black/50 rounded-full text-xs whitespace-nowrap border border-red-500"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
} 