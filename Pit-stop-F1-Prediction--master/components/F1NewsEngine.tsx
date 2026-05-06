'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LucideExternalLink, LucideClock, LucideAlertCircle } from 'lucide-react';

interface BingNewsArticle {
  name: string;
  url: string;
  image?: {
    thumbnail?: {
      contentUrl: string;
      width: number;
      height: number;
    };
  };
  description: string;
  provider: { name: string }[];
  datePublished: string;
}

const F1NewsEngine = () => {
  const [news, setNews] = useState<BingNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        // In a real scenario, this would be a direct call or through a proxy route
        // For this implementation, we simulate the Bing API structure or call a wrapper
        const response = await axios.get('/api/news');
        
        // Transform our internal API response to match the Bing structure requested in the workflow
        // or directly use the Bing API if Key was provided.
        // For now, we ensure the structure matches what was requested.
        const transformedData = response.data.map((item: any) => ({
          name: item.title,
          url: item.url,
          image: { thumbnail: { contentUrl: item.imageUrl } },
          description: item.summary,
          provider: [{ name: item.source }],
          datePublished: item.date
        }));

        setNews(transformedData);
        setError(false);
      } catch (err) {
        console.error('Bing News API Error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-pulse">
        <div className="w-12 h-12 border-4 border-[#FF1801] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-white/40 font-bold tracking-widest uppercase text-xs">Syncing Live Paddock Data...</span>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="py-20 text-center border border-white/5 rounded-xl bg-white/5 flex flex-col items-center">
        <LucideAlertCircle className="text-white/20 mb-3" size={32} />
        <span className="text-white/40 font-bold tracking-widest uppercase">Live Updates Currently Unavailable</span>
        <button 
            onClick={() => window.location.reload()}
            className="mt-4 text-[10px] text-[#FF1801] hover:underline"
        >
            RETRY CONNECTION
        </button>
      </div>
    );
  }

  const displayedNews = isExpanded ? news.slice(0, 20) : news.slice(0, 5);

  return (
    <div className="w-full max-w-[1400px] mx-auto">
      {/* 1. News Grid Layout (Hero 70% + Sidebar 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-12">
        {/* Hero Card */}
        <div 
          className="lg:col-span-7 group cursor-pointer relative"
          onClick={() => window.open(news[0].url, '_blank', 'noopener noreferrer')}
        >
          <div className="relative aspect-[21/9] overflow-hidden rounded-xl border border-white/10">
            <img 
              src={news[0].image?.thumbnail?.contentUrl || 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=1024'} 
              alt="Hero"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
            />
            <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent">
               <span className="text-[#FF1801] font-black text-[10px] tracking-[3px] uppercase mb-2 block">LATEST STORY</span>
               <h2 className="text-2xl md:text-4xl font-black text-white leading-tight uppercase tracking-tight group-hover:text-[#FF1801] transition-colors duration-300">
                  {news[0].name}
               </h2>
               <div className="flex items-center gap-4 mt-4 text-white/50 text-[10px] font-bold uppercase tracking-widest">
                  <span>{news[0].provider[0].name}</span>
                  <div className="size-1 rounded-full bg-white/20" />
                  <span>{new Date(news[0].datePublished).toLocaleDateString()}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Stack */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {news.slice(1, 4).map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.15 + 0.5 }}
              className="group flex gap-4 cursor-pointer bg-[#0b0c0d] hover:bg-[#161718] border border-white/5 p-3 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,24,1,0.05)]"
              onClick={() => window.open(item.url, '_blank', 'noopener noreferrer')}
            >
              <div className="w-24 h-20 shrink-0 rounded-md overflow-hidden relative border border-white/10">
                <img 
                  src={item.image?.thumbnail?.contentUrl || 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=1024'} 
                  alt="News"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[#FF1801] font-black text-[7px] tracking-[2px] uppercase mb-1.5 opacity-80">ANALYSIS</span>
                <h3 className="text-white/90 font-bold text-[11px] leading-tight group-hover:text-white transition-colors line-clamp-3">
                  {item.name}
                </h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 2. Secondary 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedNews.slice(4).map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.6 }}
            className="group cursor-pointer bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden hover:border-white/20 transition-all"
            onClick={() => window.open(item.url, '_blank', 'noopener noreferrer')}
          >
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={item.image?.thumbnail?.contentUrl || 'https://images.unsplash.com/photo-1533130061792-64b345e4a833?q=80&w=1024'} 
                alt="News"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                 <LucideExternalLink size={12} className="text-white/80" />
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#FF1801] text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter">F1 NEWS</span>
                  <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">
                     {new Date(item.datePublished).toLocaleDateString()}
                  </span>
              </div>
              <h4 className="text-white font-bold text-sm leading-relaxed group-hover:text-[#FF1801] transition-colors line-clamp-2 min-h-[2.8rem]">
                {item.name}
              </h4>
              <p className="text-white/40 text-[11px] mt-2 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 3. Refined Expander Button */}
      {news.length > 5 && (
        <div className="flex justify-center mt-16 pt-10 border-t border-white/5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-10 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white text-[11px] font-black tracking-[3px] uppercase hover:bg-white/10 hover:border-[#FF1801] transition-all duration-500 rounded-full flex items-center gap-6 group"
          >
            <span className="group-hover:translate-x-1 transition-transform">
               {isExpanded ? 'COLLEPSE ARCHIVE' : `UNVEIL ALL ${news.length} UPDATES`}
            </span>
            <div className={`${isExpanded ? 'rotate-180' : ''} transition-transform duration-500 text-[#FF1801]`}>
               {isExpanded ? '▲' : '▼'}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default F1NewsEngine;
