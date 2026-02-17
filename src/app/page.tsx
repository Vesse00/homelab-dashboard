'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DockerWidget from '@/components/widgets/DockerWidget';

export default function Dashboard() {
  const [containers, setContainers] = useState([]);

  useEffect(() => {
    fetch('/api/containers')
      .then(res => res.json())
      .then(data => setContainers(data));
  }, []);

  return (
    <main className="min-h-screen  text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Cześć, Admin 👋</h1>
          <p className="text-slate-500">Wszystkie systemy działają prawidłowo.</p>
        </header>

        {/* Miejsce na Widgety - Teraz Draggable! */}
        <div className="flex flex-wrap gap-6">
          
          {/* DRAGGABLE WRAPPER DLA WIDGETA DOCKER */}
          <motion.div
            drag
            dragConstraints={{ left: 0, right: 800, top: 0, bottom: 500 }}
            dragElastic={0.1}
            whileDrag={{ scale: 1.05, zIndex: 50 }}
            className="w-full max-w-sm"
          >
            <DockerWidget containers={containers} />
          </motion.div>

          {/* TUTAJ DODAMY KOLEJNE WIDGETY (KALENDARZ, SYSTEM) */}
          <motion.div
            drag
            className="w-full max-w-sm h-48 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl flex items-center justify-center text-slate-600"
          >
            Miejsce na kolejny widget...
          </motion.div>

        </div>
      </div>
    </main>
  );
}