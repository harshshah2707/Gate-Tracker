'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import {
  Users,
  Plus,
  Compass,
  Trophy,
  Flame,
  Award,
  Link as LinkIcon,
  Skull,
  UserCheck,
  AlertCircle,
  Activity,
  Copy,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groupDetails, setGroupDetails] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState<'weekly' | 'daily' | 'streak'>('weekly');
  const [feed, setFeed] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('PUBLIC');
  const [joinGroupId, setJoinGroupId] = useState('');

  const [copied, setCopied] = useState(false);

  const fetchGroups = async () => {
    try {
      const myGroups = await api.get('/groups/my');
      setGroups(myGroups);
      if (myGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(myGroups[0]);
      }
    } catch (err) {
      console.error('Failed to load groups list:', err);
    }
  };

  const fetchDetails = async (groupId: string) => {
    try {
      const details = await api.get(`/groups/${groupId}`);
      setGroupDetails(details);
      setFeed(details.activities || []);
      
      const lb = await api.get(`/groups/${groupId}/leaderboard?filter=${leaderboardFilter}`);
      setLeaderboard(lb);
    } catch (err) {
      console.error('Failed to load group details:', err);
    }
  };

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    }
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchDetails(selectedGroup.groupId);

      // Connect socket and join group room
      const socket = getSocket();
      socket.emit('group:join', { groupId: selectedGroup.groupId });

      socket.on('feed:new-activity', (newActivity: any) => {
        if (newActivity.groupId === selectedGroup.groupId) {
          setFeed((prev) => [newActivity, ...prev]);
        }
      });

      socket.on('feed:reaction-updated', (data: { activityId: string; reactions: any[] }) => {
        setFeed((prev) =>
          prev.map((act) =>
            act.activityId === data.activityId ? { ...act, reactions: data.reactions } : act
          )
        );
      });

      return () => {
        socket.emit('group:leave', { groupId: selectedGroup.groupId });
        socket.off('feed:new-activity');
        socket.off('feed:reaction-updated');
      };
    }
  }, [selectedGroup, leaderboardFilter]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newGroup = await api.post('/groups', { groupName, groupType });
      setGroupName('');
      setShowCreateForm(false);
      await fetchGroups();
      setSelectedGroup(newGroup);
      confetti({ particleCount: 60 });
    } catch (err) {
      alert('Group creation failed.');
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${joinGroupId}/members`, {});
      setJoinGroupId('');
      setShowJoinForm(false);
      await fetchGroups();
      // Find the joined group
      const joined = groups.find((g) => g.groupId === joinGroupId);
      if (joined) setSelectedGroup(joined);
      confetti({ particleCount: 40 });
    } catch (err) {
      alert('Unable to join group. Verify Group ID.');
    }
  };

  const handleReact = async (activityId: string, emoji: string) => {
    try {
      await api.post(`/feed/${activityId}/react`, { emoji });
      setFeed((prev) =>
        prev.map((act) => {
          if (act.activityId === activityId) {
            const hasReacted = act.reactions.some(
              (r: any) => r.userId === user?.userId && r.emoji === emoji
            );
            const filtered = act.reactions.filter(
              (r: any) => !(r.userId === user?.userId && r.emoji === emoji)
            );
            return {
              ...act,
              reactions: hasReacted
                ? filtered
                : [...filtered, { userId: user?.userId, emoji }],
            };
          }
          return act;
        })
      );
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  const handleCopyInvite = () => {
    if (selectedGroup) {
      navigator.clipboard.writeText(selectedGroup.groupId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">Study Groups</h2>
          <p className="text-slate-400 text-xs font-semibold">Join forces, study consistently, shame the sluggards.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowJoinForm(true);
              setShowCreateForm(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-850 hover:bg-slate-900 text-slate-300 font-bold text-xs cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Join Group</span>
          </button>
          
          <button
            onClick={() => {
              setShowCreateForm(true);
              setShowJoinForm(false);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white text-xs cursor-pointer shadow-lg shadow-indigo-600/20 active:translate-y-[1px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Creation and Join Overlay Forms */}
      {(showCreateForm || showJoinForm) && (
        <div className="p-6 rounded-2xl border border-indigo-500/10 bg-[#070d19]/45 max-w-md">
          {showCreateForm ? (
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-200 text-sm uppercase">Create Study Squad</h3>
                <button type="button" onClick={() => setShowCreateForm(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GATE AIR < 100 SQUAD"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Privacy Type</label>
                <select
                  value={groupType}
                  onChange={(e) => setGroupType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-semibold"
                >
                  <option value="PUBLIC">Public (Anyone can search & join)</option>
                  <option value="COLLEGE">College Scoped</option>
                  <option value="PRIVATE">Private (Invite Code only)</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer">
                Initialize Group
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-slate-200 text-sm uppercase">Join Spooky Room</h3>
                <button type="button" onClick={() => setShowJoinForm(false)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enter Group ID Code</label>
                <input
                  type="text"
                  required
                  placeholder="Paste Group UUID here..."
                  value={joinGroupId}
                  onChange={(e) => setJoinGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-850 text-xs focus:outline-none focus:border-indigo-500 text-white font-mono"
                />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer">
                Request Membership
              </button>
            </form>
          )}
        </div>
      )}

      {/* Main Groups View */}
      {groups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-850 bg-[#070d19]/20">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-1 text-slate-350">You are a Lone Wolf</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed mb-6">
            Studying alone is statistically linked to streak failures. Create a study squad or enter a Group ID to join peers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar selector */}
          <div className="space-y-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block px-1">Your Squads</span>
            <div className="space-y-1.5">
              {groups.map((g) => (
                <button
                  key={g.groupId}
                  onClick={() => setSelectedGroup(g)}
                  className={`w-full p-4 rounded-xl text-left border transition-all cursor-pointer ${
                    selectedGroup?.groupId === g.groupId
                      ? 'bg-indigo-950/30 border-indigo-500 text-indigo-400 font-extrabold shadow-sm'
                      : 'border-slate-850 bg-[#070d19]/25 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <p className="text-xs truncate">{g.groupName}</p>
                  <span className="text-[9px] text-slate-500 font-bold block mt-1">{g.memberCount} Members</span>
                </button>
              ))}
            </div>
          </div>

          {/* Group details panel */}
          {selectedGroup && groupDetails && (
            <div className="lg:col-span-3 space-y-6">
              
              {/* Group Metadata Summary Header */}
              <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-black text-white">{groupDetails.groupName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={handleCopyInvite}
                      className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-350 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 cursor-pointer font-bold"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Group ID</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-bold">•</span>
                    <span className="text-[10px] text-slate-500 font-bold">{groupDetails.groupType} Group</span>
                  </div>
                </div>

                <div className="flex gap-6 text-center text-xs font-bold">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Group Streak</span>
                    <span className="text-amber-500 font-black flex items-center justify-center gap-0.5 mt-0.5">
                      <Flame className="w-4 h-4 text-orange-500 animate-flame" /> {groupDetails.currentStreak}d
                    </span>
                  </div>
                  <div className="border-l border-slate-900 pl-6">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Consistency</span>
                    <span className="text-emerald-400 font-black block mt-0.5">{groupDetails.groupConsistency}%</span>
                  </div>
                </div>
              </div>

              {/* Members Accountability List & Leaderboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Members list (shaming) */}
                <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/10">
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4 block">Peer Status Check</h4>
                  <div className="space-y-3">
                    {groupDetails.members.map((member: any) => (
                      <div key={member.userId} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-850 flex items-center justify-center font-bold text-slate-400">
                            {member.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-200">{member.user.name}</p>
                            <p className="text-[9px] text-slate-500 font-bold">{member.user.college}</p>
                          </div>
                        </div>

                        {/* Status tag */}
                        <div>
                          {member.status === 'Active Today' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase">
                              <UserCheck className="w-3 h-3" /> Active Today
                            </span>
                          ) : member.status === 'Missing' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-950/40 text-yellow-400 border border-yellow-500/20 text-[9px] font-black uppercase">
                              <AlertCircle className="w-3 h-3" /> Offline
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/40 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase animate-pulse">
                              <Skull className="w-3 h-3 text-rose-500 animate-flame" /> GHOSTING 3d+
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leaderboards */}
                <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/10 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-amber-500" /> Leaderboard
                    </h4>
                    
                    {/* Filters */}
                    <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-900">
                      {['weekly', 'daily', 'streak'].map((filt) => (
                        <button
                          key={filt}
                          onClick={() => setLeaderboardFilter(filt as any)}
                          className={`px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${
                            leaderboardFilter === filt ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          {filt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px] pr-1">
                    {leaderboard.map((item, idx) => (
                      <div key={item.userId} className="flex items-center justify-between p-3 rounded-lg bg-slate-950/20 border border-slate-900 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-500 w-4">{idx + 1}.</span>
                          <span className="font-bold text-slate-200">{item.name}</span>
                        </div>

                        {/* Metric display */}
                        <div className="font-black text-slate-300">
                          {leaderboardFilter === 'weekly' ? (
                            <span>{item.weeklyHours}h <span className="text-[10px] text-slate-500 font-semibold">/wk</span></span>
                          ) : leaderboardFilter === 'daily' ? (
                            <span>{item.dailyHours}h <span className="text-[10px] text-slate-500 font-semibold">/dy</span></span>
                          ) : (
                            <span className="text-amber-500 flex items-center gap-0.5">
                              <Flame className="w-3.5 h-3.5 fill-amber-500 text-orange-500" /> {item.currentStreak}d
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Group activity feed */}
              <div className="p-5 rounded-2xl glass border-slate-800 bg-[#070d19]/20">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> Squad Live Logs
                </h4>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {feed.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-6">No squad activity logged yet.</p>
                  ) : (
                    feed.map((act) => (
                      <div key={act.activityId} className="p-3 rounded-xl bg-slate-950/45 border border-slate-900 text-xs space-y-2">
                        <p className="text-slate-350 font-medium leading-relaxed">{act.description}</p>
                        
                        {/* Reactions */}
                        <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-slate-900/60">
                          {['🔥', '⚡', '🚀', '🫡', '💪', '💀'].map((emoji) => {
                            const count = act.reactions.filter((r: any) => r.emoji === emoji).length;
                            const userReacted = act.reactions.some(
                              (r: any) => r.userId === user?.userId && r.emoji === emoji
                            );
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReact(act.activityId, emoji)}
                                className={`px-2 py-0.5 rounded-full border text-[10px] flex items-center gap-1 transition-all cursor-pointer ${
                                  userReacted
                                    ? 'bg-indigo-950/40 border-indigo-500 text-indigo-400 font-extrabold'
                                    : 'border-slate-850 bg-slate-950 text-slate-500 hover:text-slate-350'
                                }`}
                              >
                                <span>{emoji}</span>
                                {count > 0 && <span className="font-bold">{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
