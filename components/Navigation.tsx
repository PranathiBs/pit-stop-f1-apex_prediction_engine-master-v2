'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { DashboardIcon, CalendarIcon, TrophyIcon, RacingCarIcon, StatsIcon, LiveIcon } from './Icons';

const navItems = [
    { href: '/', label: 'Dashboard', Icon: DashboardIcon },
    { href: '/calendar', label: 'Calendar', Icon: CalendarIcon },
    { href: '/standings', label: 'Standings', Icon: TrophyIcon },
    { href: '/predictions', label: 'Strategy', Icon: RacingCarIcon },
    { href: '/records', label: 'Records', Icon: StatsIcon },
    { href: '/history', label: 'History', Icon: LiveIcon },
];

export default function Navigation() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            {/* ─── LOGO WATERMARK (Top Left) ─────────────────────────── */}
            <Link href="/" className="fixed top-6 left-8 z-[60] select-none group transition-all duration-700 opacity-90 hover:opacity-100 hidden md:flex items-center">
                <div className="flex items-baseline">
                    <span className="text-[26px] font-black italic tracking-tighter text-[#FF1801] uppercase leading-none" 
                          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                        PIT
                    </span>
                    <span className="text-[26px] font-black italic tracking-tighter text-white uppercase leading-none" 
                          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
                        STOP
                    </span>
                </div>
                <div className="ml-2 w-1.5 h-6 bg-[#FF1801] -skew-x-12" />
            </Link>

            {/* ─── STATUS WATERMARK (Top Right) ────────────────────────── */}
            <div className="fixed top-8 right-8 z-[60] hidden lg:flex items-center gap-3 select-none">
                {/* LIVE Indicator (Red for F1) */}
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[rgba(10,10,15,0.6)] backdrop-blur-3xl border border-[#FF1801]/20 shadow-[-10px_20px_40px_rgba(0,0,0,0.5)] group hover:bg-[#FF1801]/10 transition-all duration-500">
                    <div className="relative flex items-center justify-center">
                        <span className="absolute w-2.5 h-2.5 bg-[#FF1801] rounded-full animate-ping opacity-75" />
                        <span className="relative w-2.5 h-2.5 bg-[#FF1801] rounded-full" />
                    </div>
                    <span className="text-[#FF1801] text-[11px] font-black tracking-[0.2em] uppercase" style={{ fontFamily: 'var(--font-display)' }}>
                        LIVE
                    </span>
                </div>

                {/* 2026 REGS Watermark */}
                <div className="flex flex-col items-end px-5 py-2.5 rounded-2xl bg-[rgba(10,10,15,0.6)] backdrop-blur-3xl border border-white/10 shadow-[-10px_20px_40px_rgba(0,0,0,0.5)] hover:border-[#FF1801]/30 transition-all duration-500 cursor-default group">
                    <span className="text-white/30 text-[9px] font-bold leading-none mb-0.5 tracking-tighter uppercase group-hover:text-[#FF1801] transition-colors">VISION</span>
                    <span className="text-white/80 text-[12px] font-black tracking-wider leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                        2026 REGS
                    </span>
                </div>
            </div>

            {/* ─── SCROLL BLUR OVERLAY (Top Area) ───────────────────── */}
            <div className={cn(
                "fixed top-0 left-0 right-0 h-32 z-40 pointer-events-none transition-opacity duration-1000",
                scrolled ? "opacity-100" : "opacity-0"
            )}>
                <div className="absolute inset-0 bg-gradient-to-b from-[rgba(10,10,15,0.8)] to-transparent backdrop-blur-xl [mask-image:linear-gradient(to_bottom,black_20%,transparent)]" />
            </div>

            {/* ─── MAIN FLOATING NAV BAR (WIDER) ─────────────────────────────── */}
            <nav
                className={cn(
                    'fixed top-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 w-full max-w-[1000px] px-6 select-none',
                    scrolled ? 'translate-y-0 scale-100' : 'translate-y-2 scale-[1.01]'
                )}
            >
                <div className={cn(
                    "relative flex items-center justify-between p-2 rounded-full transition-all duration-700",
                    "bg-[rgba(5,5,8,0.85)] backdrop-blur-3xl border-2 border-white/[0.15]",
                    "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]",
                    scrolled && "shadow-[0_30px_90px_-20px_rgba(0,0,0,1)] border-white/[0.25] bg-[rgba(5,5,8,0.95)]"
                )}>
                    {/* Dynamic Ambient Blur Halo (Red) */}
                    <div className={cn(
                        "absolute inset-0 -z-10 rounded-full transition-opacity duration-700 blur-[30px]",
                        "bg-[#FF1801]/10",
                        scrolled ? "opacity-100" : "opacity-0"
                    )} />
                    
                    <div
                        className={cn(
                            'flex items-center justify-around w-full gap-2',
                            'max-md:fixed max-md:top-[90px] max-md:left-1/2 max-md:-translate-x-1/2 max-md:w-[90vw] max-md:flex-col max-md:bg-[rgba(5,5,8,0.98)] max-md:backdrop-blur-4xl max-md:border-white/10 max-md:py-8 max-md:rounded-[40px] max-md:transition-all max-md:duration-500',
                            mobileOpen ? 'max-md:opacity-100 max-md:translate-y-0' : 'max-md:opacity-0 max-md:-translate-y-8 max-md:pointer-events-none'
                        )}
                    >
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'relative flex items-center gap-3 px-6 py-2.5 rounded-full text-[13px] font-bold tracking-[0.12em] transition-all duration-500 whitespace-nowrap',
                                        isActive
                                            ? 'text-white'
                                            : 'text-white/40 hover:text-white group'
                                    )}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <item.Icon size={16} color={isActive ? '#FF1801' : 'currentColor'} 
                                               className={cn("transition-all duration-500", isActive && "scale-110 drop-shadow-[0_0_8px_rgba(255,24,1,0.5)]")} />
                                    <span style={{ fontFamily: 'var(--font-body)' }} className="uppercase">{item.label}</span>
                                    
                                    {isActive && (
                                        <motion.span 
                                            layoutId="nav-glow"
                                            className="absolute inset-x-0 bottom-0 h-[2px] bg-[#FF1801] z-[1]"
                                            transition={{ type: "spring", bounce: 0.1, duration: 0.8 }}
                                        />
                                    )}
                                    <div className={cn(
                                        "absolute inset-0 rounded-full bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[-2]",
                                        isActive && "opacity-100"
                                    )} />
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile Toggle Button (Visible only on mobile) */}
                    <button
                        className="md:hidden flex flex-col gap-[6px] w-12 h-12 items-center justify-center bg-white/[0.05] border border-white/[0.1] rounded-full transition-all hover:bg-[#FF1801]/20"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation"
                    >
                        <span className={cn(
                            'block w-6 h-[2.5px] bg-white rounded-full transition-all duration-300',
                            mobileOpen && 'translate-y-[8.5px] rotate-45 bg-[#FF1801]'
                        )} />
                        <span className={cn(
                            'block w-4 h-[2.5px] bg-white rounded-full transition-all duration-300 ml-auto',
                            mobileOpen && 'opacity-0'
                        )} />
                        <span className={cn(
                            'block w-6 h-[2.5px] bg-white rounded-full transition-all duration-300',
                            mobileOpen && '-translate-y-[8.5px] -rotate-45 bg-[#FF1801]'
                        )} />
                    </button>
                    
                    {/* Ambient Internal Glow (Red) */}
                    <div className="absolute inset-x-12 -bottom-px h-px bg-gradient-to-r from-transparent via-[#FF1801]/40 to-transparent blur-[1px]" />
                </div>
            </nav>
        </>
    );
}
