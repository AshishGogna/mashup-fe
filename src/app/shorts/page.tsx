'use client';

import { useEffect, useRef, useState } from 'react';

interface Video {
  id: string;
  url: string;
  source_id: string;
}

const INITIAL_VIDEOS: Video[] = [
  {
    id: '3',
    url: 'http://192.168.18.96:8000/api/video?id=67fb907552aaac5977b10b5d',
    source_id: 'sample_video_3'
  },
  {
    id: '4',
    url: 'http://192.168.18.96:8000/api/video?id=67fb907552aaac5977b10b5d',
    source_id: 'sample_video_3'
  },
];

const MORE_VIDEOS: Video[] = [];

// Add remote logging utility
const logToServer = async (level: 'info' | 'error', message: string, data?: any) => {
  console.log(`[${level}] ${message}`, data);
};

export default function ShortsPage() {
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);
  const [downloadedVideos, setDownloadedVideos] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const currentIndex = useRef(0);
  const lastSwipeTime = useRef(0);
  const SWIPE_COOLDOWN = 500; // 500ms cooldown between swipes
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);

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
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Handle infinite scroll
    const loadMoreObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVideos(prev => [...prev, ...MORE_VIDEOS]);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      loadMoreObserver.observe(loadMoreRef.current);
    }

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
            container.scrollTo({
              top: currentIndex.current * window.innerHeight,
              behavior: 'smooth'
            });
          } else if (deltaY < 0 && currentIndex.current > 0) {
            currentIndex.current--;
            container.scrollTo({
              top: currentIndex.current * window.innerHeight,
              behavior: 'smooth'
            });
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
        if (loadMoreRef.current) {
          loadMoreObserver.unobserve(loadMoreRef.current);
        }
      };
    }
  }, [videos]);

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
          >
            <video
              ref={el => {
                if (el) {
                  videoRefs.current[video.id] = el;
                }
              }}
              className="w-full h-full object-cover"
              src={video.url}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              controls
            />
            <div className="absolute bottom-4 left-4 text-white z-10">
              <p className="font-semibold">@{video.source_id}</p>
            </div>
          </div>
        ))}
        <div ref={loadMoreRef} className="h-20" />
      </div>
    </div>
  );
} 