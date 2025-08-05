import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Quote, Gamepad2, Shield, LogOut, Film, MapPin, User, Home, Bot, Bug } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import { GlobalSearch } from '../Search/GlobalSearch';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const { user, signOut } = useAuth();
  const isAdmin = user?.email === 'psycolife123@gmail.com';

  const tabs = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'movies', label: 'Cinema', icon: Film },
    { id: 'location', label: 'Map', icon: MapPin },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'quotes', label: 'Quotes', icon: Quote },
    { id: 'chatbot', label: 'AI Assistant', icon: Bot },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'debug', label: 'Debug', icon: Bug },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border-b border-purple-500/20 px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Entertainment Hub
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {/* Global Search */}
          <div className="hidden md:block">
            <GlobalSearch />
          </div>
          
          {/* Notifications */}
          <NotificationCenter />
          
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-300">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span>{user?.email}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden mt-3">
        {/* Mobile Search */}
        <div className="mb-3">
          <GlobalSearch />
        </div>
        
        {/* Mobile Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}