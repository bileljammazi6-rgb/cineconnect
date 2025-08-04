import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Heart, Share2, Copy, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

// 50 Inspirational Quotes in English and Arabic
const quotesData = [
  // English Quotes
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", language: "en", category: "motivation" },
  { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon", language: "en", category: "life" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", language: "en", category: "dreams" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", language: "en", category: "hope" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", language: "en", category: "action" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers", language: "en", category: "present" },
  { text: "You learn more from failure than from success.", author: "Unknown", language: "en", category: "learning" },
  { text: "If you are working on something exciting that you really care about, you don't have to be pushed.", author: "Steve Jobs", language: "en", category: "passion" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", language: "en", category: "courage" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", language: "en", category: "journey" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", language: "en", category: "opportunity" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", language: "en", category: "belief" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", language: "en", category: "destiny" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", language: "en", category: "inner strength" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", language: "en", category: "timing" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown", language: "en", category: "imagination" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown", language: "en", category: "self-motivation" },
  { text: "Great things never come from comfort zones.", author: "Unknown", language: "en", category: "growth" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown", language: "en", category: "dreams" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown", language: "en", category: "success" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown", language: "en", category: "achievement" },
  { text: "Dream bigger. Do bigger.", author: "Unknown", language: "en", category: "ambition" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown", language: "en", category: "perseverance" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown", language: "en", category: "daily motivation" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery", language: "en", category: "future" },

  // Arabic Quotes
  { text: "في وسط الصعوبة تكمن الفرصة", author: "ألبرت أينشتاين", language: "ar", category: "فرصة" },
  { text: "الحياة مثل ركوب الدراجة، للحفاظ على توازنك يجب أن تستمر في الحركة", author: "ألبرت أينشتاين", language: "ar", category: "حياة" },
  { text: "النجاح هو الانتقال من فشل إلى فشل دون فقدان الحماس", author: "ونستون تشرشل", language: "ar", category: "نجاح" },
  { text: "لا تنتظر الفرصة المثالية، اصنعها", author: "مجهول", language: "ar", category: "فرصة" },
  { text: "الطريق إلى النجاح دائماً تحت الإنشاء", author: "ليلي توملين", language: "ar", category: "نجاح" },
  { text: "أعظم مجد ليس في عدم السقوط، بل في النهوض كلما سقطنا", author: "كونفوشيوس", language: "ar", category: "مثابرة" },
  { text: "الشجاعة ليست غياب الخوف، بل مواجهة الخوف", author: "نيلسون مانديلا", language: "ar", category: "شجاعة" },
  { text: "كن التغيير الذي تريد أن تراه في العالم", author: "المهاتما غاندي", language: "ar", category: "تغيير" },
  { text: "الوقت أثمن ما نملك، لأنه الشيء الوحيد الذي لا يمكن استرداده", author: "مجهول", language: "ar", category: "وقت" },
  { text: "لا تحكم على يومك بحصاد واحد فقط، بل بالبذور التي تزرعها", author: "روبرت لويس ستيفنسون", language: "ar", category: "صبر" },
  { text: "المستقبل ملك لأولئك الذين يؤمنون بجمال أحلامهم", author: "إليانور روزفلت", language: "ar", category: "أحلام" },
  { text: "إذا كنت تريد شيئاً لم تحصل عليه من قبل، يجب أن تفعل شيئاً لم تفعله من قبل", author: "توماس جيفرسون", language: "ar", category: "تحدي" },
  { text: "النجاح ليس نهائياً، والفشل ليس قاتلاً، المهم هو الشجاعة للاستمرار", author: "ونستون تشرشل", language: "ar", category: "استمرارية" },
  { text: "لا تخف من البداية البطيئة، خف فقط من عدم البداية", author: "مثل صيني", language: "ar", category: "بداية" },
  { text: "الحلم بدون خطة مجرد أمنية", author: "أنطوان دو سانت إكزوبيري", language: "ar", category: "تخطيط" },
  { text: "كل إنجاز عظيم كان يبدو مستحيلاً في البداية", author: "مجهول", language: "ar", category: "إنجاز" },
  { text: "لا تنتظر اللحظة المناسبة، اجعل اللحظة مناسبة", author: "مجهول", language: "ar", category: "مبادرة" },
  { text: "الصبر مفتاح الفرج", author: "مثل عربي", language: "ar", category: "صبر" },
  { text: "من جد وجد، ومن زرع حصد", author: "مثل عربي", language: "ar", category: "جد واجتهاد" },
  { text: "العقل السليم في الجسم السليم", author: "مثل عربي", language: "ar", category: "صحة" },
  { text: "اطلب العلم من المهد إلى اللحد", author: "حديث شريف", language: "ar", category: "علم" },
  { text: "خير الناس أنفعهم للناس", author: "حديث شريف", language: "ar", category: "خير" },
  { text: "إنما الأعمال بالنيات", author: "حديث شريف", language: "ar", category: "نية" },
  { text: "الصديق وقت الضيق", author: "مثل عربي", language: "ar", category: "صداقة" },
  { text: "العبرة بالخواتيم", author: "مثل عربي", language: "ar", category: "نهايات" }
];

export function QuotesSection() {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem('favoriteQuotes');
    return saved ? JSON.parse(saved) : [];
  });
  const [filter, setFilter] = useState<'all' | 'en' | 'ar'>('all');
  const [autoPlay, setAutoPlay] = useState(false);

  const filteredQuotes = quotesData.filter(quote => 
    filter === 'all' || quote.language === filter
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoPlay) {
      interval = setInterval(() => {
        setCurrentQuote((prev) => (prev + 1) % filteredQuotes.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [autoPlay, filteredQuotes.length]);

  const nextQuote = () => {
    setCurrentQuote((prev) => (prev + 1) % filteredQuotes.length);
  };

  const previousQuote = () => {
    setCurrentQuote((prev) => (prev - 1 + filteredQuotes.length) % filteredQuotes.length);
  };

  const toggleFavorite = (index: number) => {
    const actualIndex = quotesData.findIndex(q => q === filteredQuotes[index]);
    const newFavorites = favorites.includes(actualIndex)
      ? favorites.filter(i => i !== actualIndex)
      : [...favorites, actualIndex];
    
    setFavorites(newFavorites);
    localStorage.setItem('favoriteQuotes', JSON.stringify(newFavorites));
    toast.success(
      favorites.includes(actualIndex) ? 'Removed from favorites' : 'Added to favorites'
    );
  };

  const shareQuote = async (quote: typeof quotesData[0]) => {
    const text = `"${quote.text}" — ${quote.author}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Inspiring Quote',
          text: text,
        });
      } catch (error) {
        navigator.clipboard.writeText(text);
        toast.success('Quote copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Quote copied to clipboard!');
    }
  };

  const quote = filteredQuotes[currentQuote];
  const actualIndex = quotesData.findIndex(q => q === quote);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-400 mb-4"
          >
            ✨ Daily Inspiration
          </motion.h2>
          <p className="text-gray-300 text-lg">Discover wisdom from around the world</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          {[
            { key: 'all', label: '🌍 All', count: quotesData.length },
            { key: 'en', label: '🇺🇸 English', count: quotesData.filter(q => q.language === 'en').length },
            { key: 'ar', label: '🇸🇦 العربية', count: quotesData.filter(q => q.language === 'ar').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key as any);
                setCurrentQuote(0);
              }}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                filter === key
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Main Quote Display */}
        <motion.div
          key={currentQuote}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-8 md:p-12 mb-8 border border-purple-500/20"
        >
          <div className="text-center">
            <Quote className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            
            <blockquote 
              className={`text-2xl md:text-4xl font-medium leading-relaxed mb-8 text-white ${
                quote.language === 'ar' ? 'text-right font-arabic' : 'text-left'
              }`}
              dir={quote.language === 'ar' ? 'rtl' : 'ltr'}
            >
              "{quote.text}"
            </blockquote>
            
            <cite className="text-xl md:text-2xl text-purple-300 not-italic font-semibold">
              — {quote.author}
            </cite>
            
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                quote.language === 'en' 
                  ? 'bg-blue-500/20 text-blue-300' 
                  : 'bg-green-500/20 text-green-300'
              }`}>
                {quote.category}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400 text-sm">
                {currentQuote + 1} of {filteredQuotes.length}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={previousQuote}
              className="p-3 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-full transition-all duration-300 hover:scale-110"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="text-center">
              <div className="text-white font-medium">
                {currentQuote + 1} / {filteredQuotes.length}
              </div>
              <div className="w-32 bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuote + 1) / filteredQuotes.length) * 100}%` }}
                />
              </div>
            </div>
            
            <button
              onClick={nextQuote}
              className="p-3 bg-gray-800/50 hover:bg-gray-700/50 text-white rounded-full transition-all duration-300 hover:scale-110"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                autoPlay
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              {autoPlay ? '⏸️ Pause' : '▶️ Auto Play'}
            </button>
            
            <button
              onClick={() => toggleFavorite(currentQuote)}
              className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                favorites.includes(actualIndex)
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Heart className={`w-5 h-5 ${favorites.includes(actualIndex) ? 'fill-current' : ''}`} />
            </button>
            
            <button
              onClick={() => shareQuote(quote)}
              className="p-3 bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 rounded-full transition-all duration-300 hover:scale-110"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/10"
          >
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-yellow-400" />
              Your Favorite Quotes ({favorites.length})
            </h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map(index => {
                const favQuote = quotesData[index];
                return (
                  <div 
                    key={index} 
                    className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300"
                  >
                    <blockquote 
                      className={`text-sm mb-3 text-gray-200 ${
                        favQuote.language === 'ar' ? 'text-right' : 'text-left'
                      }`}
                      dir={favQuote.language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      "{favQuote.text}"
                    </blockquote>
                    <cite className="text-xs text-purple-300 not-italic">
                      — {favQuote.author}
                    </cite>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        favQuote.language === 'en' 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {favQuote.category}
                      </span>
                      <button
                        onClick={() => {
                          const newFavorites = favorites.filter(i => i !== index);
                          setFavorites(newFavorites);
                          localStorage.setItem('favoriteQuotes', JSON.stringify(newFavorites));
                          toast.success('Removed from favorites');
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}