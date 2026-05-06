'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LucideExternalLink, LucideChevronRight } from 'lucide-react';

const LatestUpdates = () => {
  const [news, setNews] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/news');
      const rawData = response.data;
      const articles = Array.isArray(rawData) ? rawData : (rawData.articles || rawData.items || []);

      const newsItems = articles.map((item: any) => ({
        title: item.title || 'Paddock Update',
        description: item.summary || item.description || '',
        url: item.url || item.link || '#',
        imageUrl: item.imageUrl || item.urlToImage || '',
        category: (item.category || 'News').toUpperCase(),
        source: item.source || item.sourceName || 'F1 Insider',
        date: item.date || item.publishedAt || new Date().toISOString()
      }));

      setNews(newsItems);
      setLoading(false);
    } catch (e) {
      console.error("F1 News Engine Error:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Dynamically refresh feed every 5 minutes (300000ms) to ensure consistency with live breaking news
    const interval = setInterval(fetchNews, 300000); 
    return () => clearInterval(interval);
  }, []);

  const categories = ['ALL', 'MERCEDES', 'FERRARI', 'MCLAREN', 'REGS'];

  const filteredNews = news.filter(article => {
    if (filter === 'ALL') return true;
    const term = filter.toLowerCase();
    return (
      (article.title || '').toLowerCase().includes(term) || 
      (article.description || '').toLowerCase().includes(term) ||
      (article.category || '').toLowerCase().includes(term)
    );
  });

  const displayItems = isExpanded ? filteredNews : filteredNews.slice(0, 7);
  // Hand-curated Unsplash F1/Racing images instead of generic landscapes
  const fallbacks = [
    'https://images.unsplash.com/photo-1541410965313-d53b3c16ef17?q=80&w=1024', // Racing car on track
    'https://images.unsplash.com/photo-1510214690353-85f2ea1e0b57?q=80&w=1024', // Technical steering wheel/cockpit
    'https://images.unsplash.com/photo-1535165910397-25983e87ae14?q=80&w=1024'  // Racetrack asphalt
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 pb-32">
      <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full relative z-20 space-y-8 pb-32">
      {/* 0. Section Title Restored */}
      <div className="flex items-center gap-4 pt-12">
        <h2 className="text-white text-3xl font-black italic tracking-tighter uppercase">Latest Updates</h2>
        <div className="h-[2px] w-24 bg-red-600 rounded-full" />
      </div>

      {/* 2. Main Editorial Hero */}
      {displayItems[0] && (
        <div 
          onClick={() => window.open(displayItems[0].url, '_blank')}
          className="w-full group cursor-pointer relative mb-8"
        >
          <div className="relative aspect-video lg:aspect-[24/9] overflow-hidden rounded-2xl border border-white/10 bg-black">
            <img 
              src={displayItems[0].imageUrl || fallbacks[0]} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
              alt="Main"
              onError={(e: any) => { e.target.src = fallbacks[0]; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 lg:p-12 w-full">
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-red-600 text-white px-3 py-1 text-[11px] font-black italic rounded">FEATURED</span>
                <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">{displayItems[0].source}</span>
              </div>
              <h3 className="text-3xl md:text-5xl lg:text-5xl font-black text-white leading-tight uppercase italic tracking-tighter w-full lg:w-3/4">
                {displayItems[0].title}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* 3. Archive Grid - For all remaining items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayItems.slice(1).map((item, idx) => (
          <div 
            key={idx}
            onClick={() => window.open(item.url, '_blank')}
            className="group cursor-pointer bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-red-600/30 transition-all flex flex-col h-full"
          >
            <div className="aspect-video relative overflow-hidden shrink-0">
              <img 
                src={item.imageUrl || fallbacks[idx % 3]} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                alt="Archive"
                onError={(e: any) => { e.target.src = fallbacks[idx % 3]; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-red-500 font-black text-[9px] uppercase tracking-[2px]">{item.category}</span>
                  <div className="size-1 rounded-full bg-white/20" />
                  <span className="text-white/40 text-[9px] font-bold uppercase">{item.source}</span>
                </div>
                <h4 className="text-white font-bold text-xs lg:text-sm leading-tight uppercase line-clamp-2 opacity-90 group-hover:text-red-500 transition-colors drop-shadow-md">
                  {item.title}
                </h4>
              </div>
            </div>
            <div className="px-5 py-4 flex items-center justify-between border-t border-white/5 bg-black/20 flex-1">
              <span className="text-white/30 text-[9px] font-bold">{new Date(item.date).toLocaleDateString()}</span>
              <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-red-600/20 transition-colors">
                <LucideExternalLink size={12} className="text-white/40 group-hover:text-red-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Expander */}
      {filteredNews.length > 5 && (
        <div className="flex justify-center mt-16 pt-8 mb-8 w-full relative z-20 border-t border-white/5">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-16 py-5 bg-[#0b0c0d] border border-white/10 text-white/50 text-xs font-black uppercase tracking-[0.5em] hover:text-white hover:border-red-600 hover:shadow-[0_0_30px_rgba(220,38,38,0.15)] hover:-translate-y-1 transition-all duration-300 rounded-full flex items-center gap-6"
          >
            {isExpanded ? 'Collapse Archive Feed' : `View All ${filteredNews.length} F1 Stories`}
            <div className={`p-2 rounded-full border border-white/10 transition-colors ${isExpanded ? 'bg-red-600/10 border-red-600/30' : 'group-hover:bg-red-600/10 group-hover:border-red-600/30'}`}>
              <LucideChevronRight size={16} className={isExpanded ? '-rotate-90 text-red-600' : 'text-white/40 group-hover:text-red-600'} />
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default LatestUpdates;
