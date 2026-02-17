'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface Props {
  containers: any[];
}

export default function DockerWidget({ containers }: Props) {
  const online = containers.filter(c => c.State === 'running').length;
  const total = containers.length;
  const percentage = total > 0 ? (online / total) * 100 : 0;

  return (
    <Link href="/containers">
      <div className="h-full w-full bg-slate-900/80 border border-slate-800 p-5 rounded-3xl hover:border-blue-500/50 transition-colors group cursor-pointer overflow-hidden relative">
        {/* Tło z lekkim gradientem dla efektu */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Kontenery</h3>
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-4xl font-bold text-white">{online}</span>
            <span className="text-slate-500 text-xl font-medium ml-1">/ {total}</span>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${percentage === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
              {Math.round(percentage)}% UP
            </span>
          </div>
        </div>

        {/* Pasek postępu */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className="h-full bg-blue-500"
          />
        </div>
      </div>
    </Link>
  );
}