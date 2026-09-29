'use client';

import React, { useState, useEffect } from 'react';
import { Hospital, Volume2, VolumeX, Tv, Bell, Sparkles } from 'lucide-react';
import { playHospitalChime } from '@/lib/audio/chime';
import { PriorityBadge } from '@/components/ui/PriorityBadge';

export default function QueueDisplayPage() {
  const [time, setTime] = useState('');
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerAudioChime = () => {
    if (soundOn) playHospitalChime();
  };

  const queueTableData = [
    { tokenNo: 'EMG-001', dept: 'General Medicine', status: 'NOW SERVING' as const, priority: 'EMERGENCY' as const, highlight: true },
    { tokenNo: 'A023', dept: 'General Medicine', status: 'WAITING' as const, priority: 'NORMAL' as const, highlight: false },
    { tokenNo: 'A022', dept: 'General Medicine', status: 'COMPLETED' as const, priority: 'NORMAL' as const, highlight: false },
    { tokenNo: 'B104', dept: 'Cardiology', status: 'NOW SERVING' as const, priority: 'NORMAL' as const, highlight: true },
    { tokenNo: 'B103', dept: 'ENT', status: 'WAITING' as const, priority: 'PRIORITY' as const, highlight: false },
    { tokenNo: 'C078', dept: 'Dermatology', status: 'WAITING' as const, priority: 'NORMAL' as const, highlight: false },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans p-6 lg:p-10 flex flex-col justify-between select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-8 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-blue-500/20">
            <Hospital className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase">
              SmartCare <span className="text-slate-400 font-bold text-xl block sm:inline">City General Hospital</span>
            </h1>
            <p className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2 mt-1">
              <Tv className="w-4 h-4" /> Live Patient Display Board
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => {
              const nextState = !soundOn;
              setSoundOn(nextState);
              if (nextState) playHospitalChime();
            }}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all border cursor-pointer ${soundOn ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
            {soundOn ? 'Audio Chime ON' : 'Muted'}
          </button>

          <button
            onClick={triggerAudioChime}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            Test Chime 🔔
          </button>

          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase block tracking-wider">Mon, 21 Sep 2026</span>
            <span suppressHydrationWarning className="text-4xl font-black font-mono text-cyan-400">
              {time || '10:32 AM'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid: NOW SERVING BIG DISPLAY & QUEUE TABLE */}
      <main className="my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-stretch">
        {/* NOW SERVING FEATURED CARD */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 rounded-3xl p-8 sm:p-10 border-4 border-cyan-500 shadow-2xl flex flex-col justify-between text-center space-y-6 relative overflow-hidden ring-4 ring-cyan-500/20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <span className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black tracking-widest uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" /> LIVE CALLOUT
            </span>
            <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest">Room 102</span>
          </div>

          <div className="py-8 space-y-2">
            <span className="text-sm font-black uppercase tracking-widest text-slate-400 block">
              NOW SERVING
            </span>
            <div className="text-8xl sm:text-9xl font-black font-mono text-cyan-400 tracking-tight drop-shadow-2xl animate-pulse">
              A021
            </div>
            <div className="pt-2">
              <span className="text-lg font-black text-white block">Department:</span>
              <span className="text-2xl font-black text-blue-400 block mt-0.5">General Medicine</span>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>Please enter Consultation Room 102 when called</span>
          </div>
        </div>

        {/* QUEUE TABLE */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-4 pb-3 border-b border-slate-800">
              Live Queue Status
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-base sm:text-lg">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-extrabold text-xs tracking-wider">
                    <th className="py-3.5 px-4">Token No.</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-bold">
                  {queueTableData.map((row) => (
                    <tr
                      key={row.tokenNo}
                      className={row.highlight ? 'bg-cyan-500/10 text-white font-black' : 'text-slate-300'}
                    >
                      <td className="py-4 px-4 font-mono text-xl sm:text-2xl font-black text-cyan-400">
                        {row.tokenNo}
                      </td>
                      <td className="py-4 px-4 text-base sm:text-lg font-extrabold text-white">
                        {row.dept}
                      </td>
                      <td className="py-4 px-4">
                        <PriorityBadge priority={row.priority} />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span
                          className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black inline-block tracking-wider ${row.status === 'NOW SERVING'
                            ? 'bg-emerald-500 text-slate-950 shadow-md animate-pulse'
                            : row.status === 'COMPLETED'
                              ? 'bg-slate-800 text-slate-400 border border-slate-700'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Better Care • Brighter Tomorrows
            </span>
          </div>
        </div>
      </main>

      {/* Footer Ticker */}
      <footer className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-semibold gap-2">
        <div className="flex items-center gap-2 text-cyan-400">
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>Please be ready when your token number is called.</span>
        </div>
        <span>SmartCare Hospital Real-Time Queue Display</span>
      </footer>
    </div>
  );
}
