'use client';

import React, { useState, useEffect } from 'react';
import { PortalSidebar } from '@/components/layout/PortalSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PriorityBadge } from '@/components/ui/PriorityBadge';
import { TokenPriority } from '@/types/queue';
import { playHospitalChime } from '@/lib/audio/chime';
import { Volume2, RefreshCw, Bell, Stethoscope, CheckCircle2, Clock, Users, ArrowRight } from 'lucide-react';

export default function PatientLiveQueuePage() {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState('');

  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString());
  }, []);

  const queueList = [
    { token: 'A019', dept: 'General Medicine', status: 'COMPLETED' as const, priority: 'NORMAL' as TokenPriority, isYou: false },
    { token: 'A020', dept: 'General Medicine', status: 'COMPLETED' as const, priority: 'NORMAL' as TokenPriority, isYou: false },
    { token: 'EMG-001', dept: 'General Medicine', status: 'CALLED' as const, priority: 'EMERGENCY' as TokenPriority, isYou: false, nowServing: true },
    { token: 'A021', dept: 'General Medicine', status: 'WAITING' as const, priority: 'NORMAL' as TokenPriority, isYou: false },
    { token: 'A022', dept: 'General Medicine', status: 'WAITING' as const, priority: 'NORMAL' as TokenPriority, isYou: false },
    { token: 'A023', dept: 'General Medicine', status: 'WAITING' as const, priority: 'NORMAL' as TokenPriority, isYou: true },
    { token: 'A024', dept: 'General Medicine', status: 'WAITING' as const, priority: 'NORMAL' as TokenPriority, isYou: false },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans pb-16 md:pb-0">
      <PortalSidebar role="PATIENT" userName="Lalit" userEmail="lalit@example.com" />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto space-y-8 max-w-7xl">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 w-fit">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              Live Queue Tracker
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
              Live Queue Tracking
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-all border cursor-pointer ${audioEnabled ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
            >
              <Volume2 className={`w-4 h-4 ${audioEnabled ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
              {audioEnabled ? 'Audio Alert ON' : 'Muted'}
            </button>

            <button
              onClick={() => setLastUpdate(new Date().toLocaleTimeString())}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Refreshed: <span suppressHydrationWarning>{lastUpdate || 'Just now'}</span>
            </button>
          </div>
        </div>

        {/* NOTIFICATION CARD: Your turn is approaching */}
        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white rounded-3xl p-6 shadow-xl border border-blue-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-200 block">Queue Status Notice</span>
              <h2 className="text-xl font-black">Your turn is approaching!</h2>
              <p className="text-xs text-blue-100 font-medium">There are only 2 patients ahead of your token (A023) in General Medicine.</p>
            </div>
          </div>

          <div className="px-5 py-2.5 rounded-2xl bg-white text-blue-700 font-extrabold text-xs shadow-md shrink-0">
            Room 102 (Floor 1)
          </div>
        </div>

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-lg space-y-1">
            <span className="text-xs font-extrabold text-blue-200 uppercase">Your Token</span>
            <div className="text-5xl font-black font-mono tracking-tight">A023</div>
            <p className="text-xs text-blue-100 font-semibold">General Medicine</p>
          </div>

          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-lg space-y-1">
            <span className="text-xs font-extrabold text-slate-400 uppercase">Currently Serving</span>
            <div className="text-5xl font-black font-mono tracking-tight text-cyan-400">A021</div>
            <p className="text-xs text-emerald-400 font-bold">● Now Serving</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase">People Ahead</span>
            <div className="text-5xl font-black text-slate-900 font-mono tracking-tight">2</div>
            <p className="text-xs text-slate-500 font-medium">Patients in queue</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase">Estimated Wait</span>
            <div className="text-5xl font-black text-cyan-600 font-mono tracking-tight">15 min</div>
            <p className="text-xs text-slate-500 font-medium">~7.5 mins per patient</p>
          </div>
        </div>

        {/* ANIMATED PROGRESS INDICATOR CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900">General Medicine Queue Flow</h2>
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Dr. Rajesh Sharma (Room 102)
            </span>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-extrabold text-slate-700">
              <span>Overall Queue Progress</span>
              <span>2 Patients Ahead</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 rounded-full w-2/3 transition-all duration-700 animate-pulse" />
            </div>
          </div>

          {/* QUEUE LIST */}
          <div className="space-y-3 pt-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Queue Roster Sequence</h3>

            <div className="space-y-2.5">
              {queueList.map((item) => (
                <div
                  key={item.token}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${item.isYou
                    ? 'bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-200'
                    : item.nowServing
                      ? 'bg-cyan-50/70 border-cyan-500'
                      : 'bg-white border-slate-200/80'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black font-mono text-sm ${item.isYou
                        ? 'bg-blue-600 text-white'
                        : item.nowServing
                          ? 'bg-cyan-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                        }`}
                    >
                      {item.token}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{item.token}</span>
                        {item.isYou && (
                          <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase">
                            YOU
                          </span>
                        )}
                        {item.nowServing && (
                          <span className="px-2 py-0.5 rounded bg-cyan-500 text-white text-[10px] font-black uppercase">
                            NOW SERVING
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-bold">{item.dept}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.nowServing ? 'CALLED' : item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
