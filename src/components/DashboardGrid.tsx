'use client';

import { motion } from 'framer-motion';
import ContainerCard from './ContainerCard';

interface Props {
  containers: any[];
}

export default function DashboardGrid({ containers }: Props) {
  return (
    // Używamy standardowego CSS Grid - prosty, szybki i niezawodny
    <motion.div 
      layout
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      {containers.map((container, index) => (
        <motion.div
          key={container.Id}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ scale: 1.02 }}
          className="h-full"
        >
          <ContainerCard container={container} />
        </motion.div>
      ))}
    </motion.div>
  );
}