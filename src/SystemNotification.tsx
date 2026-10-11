import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from './lib/data';
import { db } from './lib/firebase';

export function SystemNotification() {
  const [notification, setNotification] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLatest = async () => {
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!isMounted) return;
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const id = snapshot.docs[0].id;
          
          // Only show if it's active and hasn't been dismissed by the user
          const dismissed = localStorage.getItem('dismissed_notification');
          if (data.active !== false && dismissed !== id) {
            setNotification({ id, ...data });
            setIsVisible(true);
          }
        } else {
          setIsVisible(false);
        }
      } catch {
        // Silently skip announcement banner if network or permissions fail
      }
    };

    fetchLatest();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (notification?.id) {
      localStorage.setItem('dismissed_notification', notification.id);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && notification && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/30 overflow-hidden flex flex-col relative p-5">
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-full flex-shrink-0">
                <Bell className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-slate-900 dark:text-white pr-6">{notification.title || 'Pesan Sistem'}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {notification.message}
                </p>
                {notification.createdAt && (
                  <p className="text-[10px] text-slate-400 mt-3 font-mono">
                    {new Date(notification.createdAt.toMillis ? notification.createdAt.toMillis() : notification.createdAt).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
