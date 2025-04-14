'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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
  const [videos, setVideos] = useState<Video[]>([]);
  const [prevTime, setPrevTime] = useState<number>(0);
  const [nextTime, setNextTime] = useState<number>(0);
  const [prevText, setPrevText] = useState<string>("");
  const [nextText, setNextText] = useState<string>("");
  const [downloadedVideos, setDownloadedVideos] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Add interval function
  useEffect(() => {
    const interval = setInterval(() => {
      // Your function that runs every second
      const currentVideo = videos[currentIndex.current];
      if (currentVideo) {
        const videoElement = videoRefs.current[currentVideo.id];
        if (videoElement) {
          console.log('Current video:', {
            id: currentVideo.id,
            index: currentIndex.current,
            totalVideos: videos.length,
            currentTime: Math.floor(videoElement.currentTime),
            duration: Math.floor(videoElement.duration),
            scenes: currentVideo.scenes
          });

          if (currentVideo.scenes) {
            for (let i = currentVideo.scenes.length - 1; i >= 0; i--) {
                var scene = currentVideo.scenes[i];
                var end = scene.end ? scene.end : scene.start;
                if (end == 0) {
                    setPrevText("");
                    setPrevTime(0);
                    break;
                }
                if (videoElement.currentTime > end) {
                    setPrevText("< " + scene.action + " at " + formatSceneTime(scene.start));
                    setPrevTime(scene.start);
                    break;
                }
            }
            for (var scene of currentVideo.scenes) {
                if (videoElement.currentTime < scene.start) {
                    setNextText(scene.action + " at " + formatSceneTime(scene.start) + " >");
                    setNextTime(scene.start);
                    break;
                }
            }
          }

        }
      }
    }, 1000); // Run every 1000ms (1 second)

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [videos]); // Re-run effect if videos array changes

  const fetchVideos = async (more: boolean = false) => {
    const params = new URLSearchParams();
    
    if (more) {
      params.append('last_id', videos[videos.length - 1].id);
      if (category) {
        params.append('category', category);
      }
    } else {
      if (initialVideoId) {
        params.append('with_id', initialVideoId);
      } else if (category) {
        params.append('category', category);
      }
    }

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
      });
  };

  const pauseAllVideosExcept = (currentVideoId: string) => {
    setPrevText("");
    setPrevTime(0);
    setNextText("");
    setNextTime(0);
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
        setDuration(videoElement.duration);
        setCurrentTime(videoElement.currentTime);
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

      // Handle touch events (mobile)
      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        touchStartY.current = e.touches[0].clientY;
        touchStartTime.current = Date.now();
        logToServer('info', 'Touch started', {
          startY: touchStartY.current,
          startTime: touchStartTime.current
        });
      };

      const handleTouchMove = (e: TouchEvent) => {
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

  const handleSeekStart = () => {
    setIsSeeking(true);
    const currentVideo = videos[currentIndex.current];
    if (currentVideo) {
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement) {
        videoElement.pause();
      }
    }
  };

  const handleSeekEnd = () => {
    setIsSeeking(false);
    const currentVideo = videos[currentIndex.current];
    if (currentVideo) {
      const videoElement = videoRefs.current[currentVideo.id];
      if (videoElement) {
        videoElement.play();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 flex justify-center">
      <div 
        ref={containerRef}
        className="w-full md:max-w-[414px] h-[100dvh] overflow-y-scroll snap-y snap-mandatory bg-black"
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
            {/* Navigation Buttons */}
            <div className="absolute bottom-20 left-0 right-0 flex items-center justify-between px-4 z-20">
              <button 
                onClick={() => {
                    const currentVideo = videos[currentIndex.current];
                    if (currentVideo) {
                        const videoElement = videoRefs.current[currentVideo.id];
                        if (videoElement) {
                            videoElement.currentTime = prevTime; 
                        }
                    }
                }}
                className="flex items-center rounded-full text-white transition-colors py-3"
              >
                <span className="text-sm font-medium text-left underline">{prevText}</span>
              </button>
              <button 
                onClick={() => {
                    const currentVideo = videos[currentIndex.current];
                    if (currentVideo) {
                        const videoElement = videoRefs.current[currentVideo.id];
                        if (videoElement) {
                            videoElement.currentTime = nextTime; 
                        }
                    }
                }}
                className="flex items-center rounded-full text-white transition-colors py-3"
              >
                <span className="text-sm font-medium text-right underline">{nextText}</span>
              </button>
            </div>
            {/* Custom Seekbar */}
            <div 
              className="absolute bottom-10 left-0 right-0 px-4 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="text-white text-xs">{formatTime(currentTime)}</span>
                <div className="flex-1 relative h-10">
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
                    className="absolute w-full h-full opacity-0 cursor-pointer"
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