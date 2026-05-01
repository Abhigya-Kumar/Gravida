import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Heart, MessageCircle, Share2, Users, Calendar,
  BookOpen, TrendingUp, X, Filter
} from 'lucide-react';

// ── Shared community posts (module-level so EmotionTracker can read them) ──
export const COMMUNITY_POSTS = [
  {
    id: '1', author: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    timeAgo: '2 hours ago',
    content: 'Just had my 20-week ultrasound! Everything looks perfect. Feeling so grateful and excited! 💙',
    likes: 24, comments: 8, trimester: '2nd Trimester', emotion: 'happy', isLiked: false,
  },
  {
    id: '2', author: 'Emily Chen',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    timeAgo: '5 hours ago',
    content: 'Anyone else dealing with back pain? What stretches or exercises have helped? Looking for recommendations! 🤰',
    likes: 18, comments: 15, trimester: '3rd Trimester', emotion: 'sad', isLiked: true,
  },
  {
    id: '3', author: 'Maria Garcia',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    timeAgo: '1 day ago',
    content: "Finally got the nursery set up! It turned out better than I imagined. Can't wait to meet our little one! 🌸",
    likes: 42, comments: 12, trimester: '3rd Trimester', emotion: 'happy', isLiked: false,
  },
  {
    id: '4', author: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100',
    timeAgo: '3 hours ago',
    content: 'First trimester and feeling so anxious all the time 😟 Any tips on calming nerves? My mind won\'t stop racing.',
    likes: 31, comments: 20, trimester: '1st Trimester', emotion: 'fear', isLiked: false,
  },
  {
    id: '5', author: 'Lisa Thompson',
    avatar: 'https://images.unsplash.com/photo-1546961342-ea5f62d4c561?w=100',
    timeAgo: '6 hours ago',
    content: 'Feeling so stressed today — work, appointments, everything at once. Pregnancy is beautiful but also overwhelming 😤',
    likes: 19, comments: 14, trimester: '2nd Trimester', emotion: 'angry', isLiked: false,
  },
  {
    id: '6', author: 'Avni Patel',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100',
    timeAgo: '8 hours ago',
    content: 'Just feeling blah today — not sad exactly, just low energy 😔 Is this normal in the third trimester?',
    likes: 27, comments: 11, trimester: '3rd Trimester', emotion: 'sad', isLiked: false,
  },
  {
    id: '7', author: 'Rachel Kim',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    timeAgo: '12 hours ago',
    content: 'Baby shower was AMAZING! 🎉 So grateful for all my friends and family. Still smiling ear to ear 😄',
    likes: 55, comments: 23, trimester: '3rd Trimester', emotion: 'surprise', isLiked: false,
  },
  {
    id: '8', author: 'Nadia Hassan',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    timeAgo: '1 day ago',
    content: 'Calm and centred today after my morning yoga session 🧘‍♀️ Highly recommend prenatal yoga to everyone!',
    likes: 38, comments: 9, trimester: '2nd Trimester', emotion: 'neutral', isLiked: false,
  },
];

const EMOTION_LABELS = {
  happy:    'Happy 😊',
  sad:      'Sad 😢',
  fear:     'Anxious 😟',
  angry:    'Stressed 😤',
  neutral:  'Calm 😐',
  surprise: 'Surprised 😮',
  disgust:  'Uneasy 😣',
};

const TRIMESTER_OPTIONS = ['All', '1st Trimester', '2nd Trimester', '3rd Trimester'];

// Expose posts globally so EmotionTracker can read them without importing a store
if (typeof window !== 'undefined') window.__GRAVIDA_POSTS__ = COMMUNITY_POSTS;

export function Community({ onNavigate, initialEmotionFilter = null }) {
  const [posts, setPosts]               = useState(COMMUNITY_POSTS);
  const [newPost, setNewPost]           = useState('');
  const [searchQuery, setSearchQuery]   = useState('');
  const [trimesterFilter, setTrimester] = useState('All');
  const [emotionFilter, setEmotion]     = useState(initialEmotionFilter || 'All');
  const [openPostId, setOpenPostId]     = useState(null);
  const [showFilters, setShowFilters]   = useState(false);

  // If parent pushes a new emotion filter (from EmotionTracker link)
  useEffect(() => {
    if (initialEmotionFilter && initialEmotionFilter !== 'All') {
      setEmotion(initialEmotionFilter);
    }
  }, [initialEmotionFilter]);

  const handleLike = (postId) => {
    setPosts(p => p.map(post =>
      post.id === postId
        ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handlePostSubmit = () => {
    if (!newPost.trim()) return;
    const p = {
      id: Date.now().toString(),
      author: 'You',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
      timeAgo: 'Just now',
      content: newPost,
      likes: 0, comments: 0,
      trimester: trimesterFilter === 'All' ? '2nd Trimester' : trimesterFilter,
      emotion: emotionFilter === 'All' ? 'neutral' : emotionFilter,
      isLiked: false,
    };
    setPosts(prev => [p, ...prev]);
    setNewPost('');
  };

  const filteredPosts = posts.filter(p => {
    const matchSearch = !searchQuery
      || p.content.toLowerCase().includes(searchQuery.toLowerCase())
      || p.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTrimester = trimesterFilter === 'All' || p.trimester === trimesterFilter;
    const matchEmotion   = emotionFilter   === 'All' || p.emotion  === emotionFilter;
    return matchSearch && matchTrimester && matchEmotion;
  });

  const openPost = posts.find(p => p.id === openPostId);

  const clearFilters = () => { setTrimester('All'); setEmotion('All'); setSearchQuery(''); };
  const hasFilter = trimesterFilter !== 'All' || emotionFilter !== 'All' || searchQuery;

  // ── Post modal ────────────────────────────────────────────────────────────
  if (openPost) return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={() => setOpenPostId(null)}>
        ← Back to Community
      </Button>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Avatar>
              <AvatarFallback>{openPost.author[0]}</AvatarFallback>
              <img src={openPost.avatar} alt={openPost.author} className="w-full h-full object-cover rounded-full" />
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold">{openPost.author}</span>
                <Badge variant="secondary" className="text-xs">{openPost.trimester}</Badge>
                {openPost.emotion && openPost.emotion !== 'neutral' && (
                  <Badge className="text-xs bg-pink-100 text-pink-700 border-pink-200">
                    {EMOTION_LABELS[openPost.emotion] ?? openPost.emotion}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">{openPost.timeAgo}</p>
              <p className="text-base mb-5 leading-relaxed">{openPost.content}</p>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={() => handleLike(openPost.id)}
                  className={openPost.isLiked ? 'text-[#FF69B4]' : ''}>
                  <Heart className={`w-4 h-4 mr-2 ${openPost.isLiked ? 'fill-current' : ''}`} />
                  {openPost.likes}
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="w-4 h-4 mr-2" /> {openPost.comments}
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4 mr-2" /> Share
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* More posts like this */}
      <div className="mt-4">
        <h3 className="font-bold mb-3 text-base">More posts like this</h3>
        <div className="space-y-3">
          {posts
            .filter(p => p.id !== openPost.id && p.emotion === openPost.emotion)
            .slice(0, 3)
            .map(p => (
              <Card key={p.id} className="cursor-pointer hover:border-[#5B7FDB] transition-colors"
                onClick={() => setOpenPostId(p.id)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{p.author[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <span className="font-semibold text-sm">{p.author}</span>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
        <Button variant="outline" className="w-full mt-3 font-semibold"
          onClick={() => { setEmotion(openPost.emotion); setOpenPostId(null); }}>
          See all posts about {EMOTION_LABELS[openPost.emotion] ?? openPost.emotion} →
        </Button>
      </div>
    </div>
  );

  // ── Main community view ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Community Members', value: '2,847', sub: '+127 this week', icon: <Users className="w-5 h-5 text-[#5B7FDB]" /> },
          { label: 'Active Discussions', value: '384',  sub: 'Updated today',   icon: <MessageCircle className="w-5 h-5 text-[#FF69B4]" /> },
          { label: 'Support Score',      value: '98%',  sub: 'Positive feedback',icon: <Heart className="w-5 h-5 text-[#87CEEB]" /> },
        ].map(s => (
          <Card key={s.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">{s.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">{s.icon}<span className="text-2xl">{s.value}</span></div>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {/* Create Post */}
          <Card>
            <CardHeader>
              <CardTitle className="font-bold">Share with the Community</CardTitle>
              <CardDescription>Connect with other expecting mothers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's on your mind? Share your thoughts, questions, or experiences..."
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-between items-center">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="cursor-pointer hover:bg-[#E8EFFF]">2nd Trimester</Badge>
                </div>
                <Button onClick={handlePostSubmit} className="bg-[#5B7FDB] hover:bg-[#4A6ECA]"
                  disabled={!newPost.trim()}>Post</Button>
              </div>
            </CardContent>
          </Card>

          {/* Search + Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-bold text-sm">Filter Posts</CardTitle>
                <div className="flex gap-2">
                  {hasFilter && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                      <X className="w-3 h-3 mr-1" /> Clear
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
                    <Filter className="w-3 h-3 mr-1" />
                    Filters {hasFilter ? `(active)` : ''}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Search posts by content or author..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />

              {showFilters && (
                <div className="space-y-3 pt-2 border-t">
                  {/* Trimester filter */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">BY TRIMESTER</p>
                    <div className="flex flex-wrap gap-2">
                      {TRIMESTER_OPTIONS.map(t => (
                        <Badge
                          key={t}
                          variant={trimesterFilter === t ? 'default' : 'outline'}
                          className={`cursor-pointer transition-colors ${trimesterFilter === t ? 'bg-[#5B7FDB] text-white' : 'hover:bg-[#E8EFFF]'}`}
                          onClick={() => setTrimester(t)}
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Emotion filter */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">BY EMOTION</p>
                    <div className="flex flex-wrap gap-2">
                      {['All', ...Object.keys(EMOTION_LABELS)].map(e => (
                        <Badge
                          key={e}
                          variant={emotionFilter === e ? 'default' : 'outline'}
                          className={`cursor-pointer transition-colors ${emotionFilter === e ? 'bg-[#FF69B4] text-white border-[#FF69B4]' : 'hover:bg-[#FFE8F5]'}`}
                          onClick={() => setEmotion(e)}
                        >
                          {e === 'All' ? 'All Emotions' : EMOTION_LABELS[e]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {hasFilter && (
                <p className="text-xs text-muted-foreground">
                  Showing {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
                  {trimesterFilter !== 'All' ? ` · ${trimesterFilter}` : ''}
                  {emotionFilter   !== 'All' ? ` · ${EMOTION_LABELS[emotionFilter] ?? emotionFilter}` : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Posts feed */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <Card><CardContent className="pt-6 text-center text-muted-foreground">No posts match your filters.</CardContent></Card>
            ) : filteredPosts.map(post => (
              <Card key={post.id} className="cursor-pointer hover:border-[#5B7FDB] transition-colors"
                onClick={() => setOpenPostId(post.id)}>
                <CardContent className="pt-6" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarFallback>{post.author[0]}</AvatarFallback>
                      <img src={post.avatar} alt={post.author} className="w-full h-full object-cover rounded-full" onError={e => { e.target.style.display = 'none'; }} />
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="font-semibold">{post.author}</span>
                        <Badge variant="secondary" className="text-xs">{post.trimester}</Badge>
                        {post.emotion && post.emotion !== 'neutral' && (
                          <Badge className="text-xs bg-pink-100 text-pink-700 border-pink-200">
                            {EMOTION_LABELS[post.emotion] ?? post.emotion}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{post.timeAgo}</p>
                      <p className="mb-4 line-clamp-3">{post.content}</p>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleLike(post.id)}
                          className={post.isLiked ? 'text-[#FF69B4]' : ''}>
                          <Heart className={`w-4 h-4 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
                          {post.likes}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setOpenPostId(post.id)}>
                          <MessageCircle className="w-4 h-4 mr-1" />{post.comments}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4 mr-1" />Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold">
                <Calendar className="w-5 h-5 text-[#5B7FDB]" /> Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Prenatal Yoga Class', date: 'Nov 5, 2025', participants: 12 },
                { title: 'Nutrition Workshop',   date: 'Nov 8, 2025', participants: 24 },
                { title: 'Virtual Support Group',date: 'Nov 12, 2025', participants: 18 },
              ].map((event, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#E8EFFF] hover:bg-[#D8DFEF] transition-colors cursor-pointer">
                  <h4 className="mb-1 text-sm font-semibold">{event.title}</h4>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{event.date}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.participants}</span>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">View All Events</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold">
                <TrendingUp className="w-5 h-5 text-[#FF69B4]" /> Trending Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {['#PregnancyNutrition', '#BabyKicks', '#NurseryIdeas', '#SelfCare', '#BirthPlan'].map((topic, i) => (
                <div key={i} className="p-2 rounded hover:bg-[#FFE8F5] transition-colors cursor-pointer">
                  <span style={{ color: '#FF69B4' }}>{topic}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-bold">
                <BookOpen className="w-5 h-5 text-[#87CEEB]" /> Must-Read Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { title: 'Managing Morning Sickness', category: 'Health',    readTime: '5 min' },
                { title: 'Creating a Birth Plan',     category: 'Planning',  readTime: '8 min' },
                { title: 'Exercise During Pregnancy', category: 'Fitness',   readTime: '6 min' },
                { title: 'Preparing for Breastfeeding',category: 'Nutrition',readTime: '10 min' },
              ].map((a, i) => (
                <div key={i} className="p-3 rounded-lg border hover:border-[#87CEEB] transition-colors cursor-pointer">
                  <h4 className="text-sm mb-1">{a.title}</h4>
                  <div className="flex justify-between">
                    <Badge variant="outline" className="text-xs">{a.category}</Badge>
                    <span className="text-xs text-muted-foreground">{a.readTime}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
