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
import { TicTacToe } from './components/Games/TicTacToe';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { UserProfile } from './components/Profile/UserProfile';
import { SocialFeed } from './components/Social/SocialFeed';
import { Chatbot } from './components/Chat/Chatbot';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
              <Chatbot />
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="flex h-full">
            <ChatList 
              onSelectUser={setSelectedUser} 
              selectedUserId={selectedUser?.id}
            />
            {selectedUser ? (
              <ChatWindow selectedUser={selectedUser} />
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
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
        return (
          <div className="p-6 bg-gray-50 min-h-full">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Games</h2>
              <div className="flex justify-center">
                <TicTacToe />
              </div>
            </div>
          </div>
        );
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
