import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
}

export function ChatbotFallbackOnly() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your entertainment assistant! I can help you find movies, recommend shows, answer questions about our platform, or just chat. What would you like to know?",
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse = getSmartResponse(userMessage.content);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const getSmartResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Greeting responses
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      const greetings = [
        "Hello! Welcome to our entertainment platform! I'm here to help you discover amazing movies, series, and anime. What are you in the mood for today?",
        "Hi there! Ready to explore some great entertainment? I can help you find movies, shows, anime, or guide you through our platform features!",
        "Hey! Great to see you here! I'm your entertainment guide. What kind of content are you looking for?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Movie recommendations
    if (input.includes('movie') || input.includes('film')) {
      return "🎬 Great choice! Our movie collection includes:\n\n• **Classics**: Interstellar, Memento, The Invisible Guest\n• **Action**: Mission Impossible, 6 Underground\n• **Drama**: 17 Again, Free Guy\n• **International**: Mirage, The Match\n\nYou can find all movies in the Movies section with direct watch links! What genre interests you most?";
    }
    
    // Anime recommendations
    if (input.includes('anime')) {
      return "🎌 Awesome! We have fantastic anime series:\n\n• **Action**: Attack on Titan, Jujutsu Kaisen\n• **Adventure**: Solo Leveling\n• **Popular**: All available with multiple episodes\n\nAll anime are in the Movies section with episode-by-episode links. Which type of anime do you prefer?";
    }
    
    // Series recommendations
    if (input.includes('series') || input.includes('show') || input.includes('tv')) {
      return "📺 Excellent! Our series collection features:\n\n• **Drama**: 11.22.63, The Queen's Gambit\n• **Thriller**: Squid Game, All of Us Are Dead\n• **Legal**: Suits\n• **Fantasy**: The Wheel of Time\n\nEach series has multiple episodes ready to stream. What type of series are you looking for?";
    }
    
    // Platform features
    if (input.includes('help') || input.includes('feature') || input.includes('what can')) {
      return "🌟 Here's everything you can do on our platform:\n\n🎬 **Movies & Shows**: Stream with direct links\n💬 **Real-time Chat**: Message other users instantly\n✨ **Quotes**: Read and share inspirational quotes\n🗺️ **World Map**: See where users are located\n🎮 **Games**: Play Tic Tac Toe with friends\n👥 **Social Feed**: Create posts and interact\n📍 **Location Events**: Join local meetups\n\nWhat would you like to explore first?";
    }
    
    // Chat features
    if (input.includes('chat') || input.includes('message')) {
      return "💬 Our chat system is amazing! You can:\n\n• Send real-time messages to any user\n• Share images in conversations\n• Send your location to friends\n• See when messages are read\n• React to messages with emojis\n\nJust go to the Chat section and start conversations with other movie lovers!";
    }
    
    // Recommendations
    if (input.includes('recommend') || input.includes('suggest') || input.includes('what should')) {
      const recommendations = [
        "🔥 **Top Picks Right Now**:\n\n🎬 **Movies**: Interstellar (mind-bending sci-fi), The Invisible Guest (thriller masterpiece)\n📺 **Series**: Squid Game (intense drama), 11.22.63 (time travel thriller)\n🎌 **Anime**: Attack on Titan (epic action), Jujutsu Kaisen (supernatural fights)\n\nWhat genre speaks to you?",
        "✨ **Curated for You**:\n\n• **Feel-good**: Free Guy, 17 Again\n• **Mind-bending**: Memento, Mirage\n• **Action-packed**: Mission Impossible, 6 Underground\n• **Anime adventure**: Solo Leveling, Jujutsu Kaisen\n\nTell me your mood and I'll narrow it down!",
        "🎯 **Popular Choices**:\n\n1. **Interstellar** - Epic space drama\n2. **The Queen's Gambit** - Chess prodigy story\n3. **Attack on Titan** - Humanity vs giants\n4. **Squid Game** - Survival thriller\n\nAny of these catch your interest?"
      ];
      return recommendations[Math.floor(Math.random() * recommendations.length)];
    }
    
    // Games
    if (input.includes('game') || input.includes('play')) {
      return "🎮 Fun time! We have games built right in:\n\n• **Tic Tac Toe**: Play against other users online\n• **More games coming soon**!\n\nHead to the Games section to start playing. You can challenge other users and track your scores!";
    }
    
    // Location/Map
    if (input.includes('map') || input.includes('location') || input.includes('where')) {
      return "🗺️ Our World Map is so cool! You can:\n\n• See where other users are located globally\n• Share your own location (optional)\n• Find users nearby\n• Discover local movie events\n\nCheck out the Location section to explore the global community!";
    }
    
    // Social features
    if (input.includes('social') || input.includes('post') || input.includes('friend')) {
      return "👥 Our social features are great for connecting:\n\n• **Social Feed**: Share posts and updates\n• **Follow System**: Follow your favorite users\n• **Comments & Likes**: Engage with content\n• **Movie Invitations**: Invite friends to watch together\n\nJoin the community in the Social Feed section!";
    }
    
    // Quotes
    if (input.includes('quote') || input.includes('inspiration')) {
      return "✨ Our Quotes section is inspiring! You can:\n\n• Read motivational quotes from users\n• Share your own favorite quotes\n• Like quotes that resonate with you\n• Browse by categories\n\nPerfect for daily motivation and sharing wisdom!";
    }
    
    // Technical questions
    if (input.includes('how') || input.includes('work')) {
      return "🔧 Here's how our platform works:\n\n• **Streaming**: Direct links to watch content instantly\n• **Real-time**: Live chat and notifications\n• **Secure**: All your data is protected\n• **Fast**: Optimized for smooth experience\n• **Global**: Connect with users worldwide\n\nEverything is designed to make your entertainment experience seamless!";
    }
    
    // Positive responses
    if (input.includes('thanks') || input.includes('thank you')) {
      return "You're very welcome! I'm always here to help you discover great entertainment and navigate our platform. Enjoy exploring! 🎬✨";
    }
    
    if (input.includes('good') || input.includes('great') || input.includes('awesome')) {
      return "I'm so glad you're enjoying it! There's so much more to explore. Feel free to ask me anything about movies, shows, or platform features anytime! 🌟";
    }
    
    // Default responses with personality
    const defaultResponses = [
      "That's interesting! I'm here to help with anything related to our entertainment platform. You can ask me about movies, shows, anime, platform features, or just chat! What would you like to know?",
      "I'd love to help you with that! I specialize in entertainment recommendations and platform guidance. Try asking me about movies, series, anime, or any of our cool features like chat, games, or the world map!",
      "Great question! I'm your entertainment assistant, so I'm best at helping with movie recommendations, platform features, and general entertainment topics. What are you in the mood for today?",
      "I'm here to make your entertainment experience amazing! Whether you want movie suggestions, need help with platform features, or just want to chat about shows and anime, I'm your guide! 🎬"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-purple-500/20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-medium text-white">Entertainment Assistant</h3>
          <p className="text-sm text-gray-400">Smart recommendation engine</p>
        </div>
        <div className="ml-auto">
          <Sparkles className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.isBot
                    ? 'bg-gray-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                <p className="text-xs mt-2 opacity-70">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-700 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-300">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about movies, shows, or platform features..."
            className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            disabled={isLoading}
            maxLength={500}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-2 rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
}