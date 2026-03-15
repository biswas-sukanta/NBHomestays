'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Crown, Medal, Trophy, Users, MapPin, Sparkles } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry } from '@/lib/api/feed';

// Rank styling configuration
const RANK_STYLES = {
  1: {
    container: 'bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20',
    rank: 'bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950',
    crown: 'text-amber-400',
    glow: 'animate-pulse',
  },
  2: {
    container: 'bg-gradient-to-r from-slate-400/20 via-gray-300/20 to-slate-400/20 border-2 border-slate-400 shadow-lg shadow-slate-400/20',
    rank: 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900',
    crown: 'text-slate-400',
    glow: '',
  },
  3: {
    container: 'bg-gradient-to-r from-orange-600/20 via-amber-600/20 to-orange-600/20 border-2 border-orange-500 shadow-lg shadow-orange-500/20',
    rank: 'bg-gradient-to-br from-orange-500 to-amber-600 text-orange-950',
    crown: 'text-orange-500',
    glow: '',
  },
};

function getRankStyle(rank: number) {
  return RANK_STYLES[rank as keyof typeof RANK_STYLES] || {
    container: 'bg-card border border-border hover:border-primary/50',
    rank: 'bg-muted text-muted-foreground',
    crown: '',
    glow: '',
  };
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        setError('Failed to load leaderboard');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfBoard = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Community Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">
            Top travelers ranked by experience points. Climb the ranks by sharing stories, helping others, and exploring North Bengal.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Top Travelers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topThree.map((entry, index) => {
                const style = getRankStyle(entry.rank);
                const positions = ['md:order-2', 'md:order-1', 'md:order-3'];
                
                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${positions[index]} ${style.container} rounded-xl p-6 relative overflow-hidden`}
                    data-testid={`leaderboard-podium-${entry.rank}`}
                  >
                    {/* Rank Badge */}
                    <div className={`absolute -top-2 -right-2 w-12 h-12 ${style.rank} rounded-full flex items-center justify-center font-bold text-xl shadow-lg`}>
                      {entry.rank}
                    </div>
                    
                    {/* Crown for top 3 */}
                    {entry.rank <= 3 && (
                      <Crown className={`absolute top-2 left-2 w-6 h-6 ${style.crown} ${style.glow}`} />
                    )}
                    
                    <Link href={`/profile/${entry.userId}`} className="block">
                      {/* Avatar */}
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-3">
                          {entry.avatarUrl ? (
                            <Image
                              src={entry.avatarUrl}
                              alt={entry.displayName}
                              width={80}
                              height={80}
                              className="rounded-full border-2 border-primary/30"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-2xl font-bold border-2 border-primary/30">
                              {entry.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {/* Stage Icon */}
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                        
                        {/* Name */}
                        <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
                          {entry.displayName}
                        </h3>
                        
                        {/* Stage */}
                        <p className="text-sm text-muted-foreground mb-3">
                          {entry.stageTitle}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-primary" />
                            <span className="font-semibold">{entry.totalXp.toLocaleString()} XP</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {entry.postCount} posts
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {entry.followersCount} followers
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        {restOfBoard.length > 0 && (
          <div data-testid="leaderboard-list">
            <h2 className="text-xl font-semibold mb-4">Rankings</h2>
            <div className="space-y-2">
              {restOfBoard.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={`/profile/${entry.userId}`}
                    className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all group"
                    data-testid={`leaderboard-entry-${entry.rank}`}
                  >
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {entry.rank}
                    </div>
                    
                    {/* Avatar */}
                    <div className="relative">
                      {entry.avatarUrl ? (
                        <Image
                          src={entry.avatarUrl}
                          alt={entry.displayName}
                          width={48}
                          height={48}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center font-bold">
                          {entry.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {entry.displayName}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {entry.stageTitle}
                      </p>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="font-semibold">{entry.totalXp.toLocaleString()}</span>
                        <span className="text-muted-foreground">XP</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{entry.postCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{entry.followersCount}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <Medal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No travelers on the leaderboard yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Be the first to earn XP!</p>
          </div>
        )}
      </div>
    </div>
  );
}
