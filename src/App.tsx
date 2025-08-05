import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/Auth/AuthForm';
import { Navigation } from './components/Layout/Navigation';
import { ChatList } from './components/Chat/ChatList';
import { MoviesSection } from './components/Movies/MoviesSection';
import { QuotesSection } from './components/Quotes/QuotesSection';
import { LocationMap } from './components/Location/LocationMap';
import { ChatWindow } from './components/Chat/ChatWindow';

import { AdminDashboard } from './components/Admin/AdminDashboard';
import { UserProfile } from './components/Profile/UserProfile';
import { SocialFeed } from './components/Social/SocialFeed';
import { ChatbotFallbackOnly } from './components/Chat/ChatbotFallbackOnly';
import GamesHub from './components/Games/GamesHub';


interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  last_seen: string | null;
}

function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('movies');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Environment check for critical variables
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">Configuration Required</h1>
          <div className="text-left space-y-2 text-sm mb-4 bg-gray-50 p-3 rounded">
            <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
            <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
            <div>Environment: {import.meta.env.MODE}</div>
          </div>
          <p className="text-gray-600 text-sm">
            Please set the required environment variables in your Netlify deployment settings and redeploy.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CineConnect...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthForm />
        <Toaster position="top-right" />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <SocialFeed />;
      case 'movies':
        return <MoviesSection />;
      case 'location':
        return <LocationMap />;
      case 'quotes':
        return <QuotesSection />;
      case 'chatbot':
        return (
          <div className="p-6 bg-gray-50 min-h-full">
            <div className="max-w-4xl mx-auto h-[calc(100vh-200px)]">
              <ChatbotFallbackOnly />
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="flex h-full">
            {/* Mobile: Show only ChatList or ChatWindow */}
            <div className={`${selectedUser ? 'hidden lg:flex' : 'flex'} lg:flex`}>
              <ChatList 
                onSelectUser={setSelectedUser} 
                selectedUserId={selectedUser?.id}
              />
            </div>
            
            {/* Desktop: Always show, Mobile: Only when user selected */}
            {selectedUser ? (
              <div className={`flex-1 ${selectedUser ? 'flex' : 'hidden lg:flex'}`}>
                <ChatWindow 
                  selectedUser={selectedUser} 
                  onBack={() => setSelectedUser(null)}
                />
              </div>
            ) : (
              <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h3 className="text-xl font-medium text-gray-500 mb-2">Select a conversation</h3>
                  <p className="text-gray-400">Choose someone to start chatting with</p>
                </div>
              </div>
            )}
          </div>
        );
      case 'games':
        return <GamesHub />;
      case 'profile':
        return <UserProfile />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
