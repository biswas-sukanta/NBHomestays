'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageCircle, MoreHorizontal, Search, Trash2, Pencil, Reply, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface HomestayAnswer {
    id: string;
    text: string;
    createdAt: string;
    userFirstName: string;
    userLastName: string;
    isHost: boolean;
}

interface HomestayQuestion {
    id: string;
    text: string;
    createdAt: string;
    userFirstName: string;
    userLastName: string;
    answers: HomestayAnswer[];
}

export function HomestayQASection({ homestayId }: { homestayId: string }) {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [searchQ, setSearchQ] = useState('');
    const [newQuestion, setNewQuestion] = useState('');

    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [editingQ, setEditingQ] = useState<string | null>(null);
    const [editQText, setEditQText] = useState('');
    const [editingA, setEditingA] = useState<string | null>(null);
    const [editAText, setEditAText] = useState('');

    const { data: questions = [], isLoading } = useQuery({
        queryKey: ['questions', homestayId],
        queryFn: async () => {
            const res = await api.get(`/api/homestays/${homestayId}/questions`);
            return res.data as HomestayQuestion[];
        },
    });

    const askMutation = useMutation({
        mutationFn: async (text: string) => await api.post(`/api/homestays/${homestayId}/questions`, { text }),
        onSuccess: () => {
            toast.success('Question posted successfully!');
            setNewQuestion('');
            queryClient.invalidateQueries({ queryKey: ['questions', homestayId] });
        }
    });

    const editQMutation = useMutation({
        mutationFn: async ({ id, text }: { id: string, text: string }) => await api.put(`/api/questions/${id}`, { text }),
        onSuccess: () => { setEditingQ(null); queryClient.invalidateQueries({ queryKey: ['questions', homestayId] }); }
    });

    const deleteQMutation = useMutation({
        mutationFn: async (id: string) => await api.delete(`/api/questions/${id}`),
        onSuccess: () => { toast.success('Question deleted'); queryClient.invalidateQueries({ queryKey: ['questions', homestayId] }); }
    });

    const replyMutation = useMutation({
        mutationFn: async ({ qId, text }: { qId: string, text: string }) => await api.post(`/api/questions/${qId}/answers`, { text }),
        onSuccess: () => { setReplyingTo(null); setReplyText(''); queryClient.invalidateQueries({ queryKey: ['questions', homestayId] }); }
    });

    const editAMutation = useMutation({
        mutationFn: async ({ id, text }: { id: string, text: string }) => await api.put(`/api/answers/${id}`, { text }),
        onSuccess: () => { setEditingA(null); queryClient.invalidateQueries({ queryKey: ['questions', homestayId] }); }
    });

    const deleteAMutation = useMutation({
        mutationFn: async (id: string) => await api.delete(`/api/answers/${id}`),
        onSuccess: () => { toast.success('Reply deleted'); queryClient.invalidateQueries({ queryKey: ['questions', homestayId] }); }
    });

    const filteredQuestions = questions.filter(q =>
        q.text.toLowerCase().includes(searchQ.toLowerCase()) ||
        q.answers.some(a => a.text.toLowerCase().includes(searchQ.toLowerCase()))
    );

    const isOwner = (firstName?: string) => user?.firstName === firstName || user?.role === 'ROLE_ADMIN';

    return (
        <section className="mt-8 border-b border-gray-200 w-full mb-8 pt-6 md:pt-0">
            <div className="bg-gray-50/80 p-5 md:p-8 rounded-3xl w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 tracking-tight">
                            Community Q&A
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">Ask the host or past guests about this stay.</p>
                    </div>

                    <div className="relative max-w-sm w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search questions..."
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                            className="pl-9 bg-white border-gray-200 focus-visible:ring-1 rounded-full shadow-sm"
                        />
                    </div>
                </div>

                {/* Ask Box (Premium textarea) */}
                <div className="mb-10 flex gap-3 md:gap-4 bg-white p-4 md:p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-tr from-primary/20 to-primary/10 text-primary flex items-center justify-center font-bold flex-none text-base md:text-lg shadow-inner">
                        {isAuthenticated ? user?.firstName?.[0]?.toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 space-y-3">
                        <Textarea
                            placeholder={isAuthenticated ? "Ask a question about this stay..." : "Please log in to ask a question."}
                            value={newQuestion}
                            onChange={e => setNewQuestion(e.target.value)}
                            disabled={!isAuthenticated || askMutation.isPending}
                            className="resize-none min-h-[50px] bg-transparent border-0 focus-visible:ring-0 p-0 text-base shadow-none font-medium placeholder:text-gray-400"
                        />
                        <div className="flex justify-end pt-2 border-t border-gray-50">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                    disabled={!newQuestion.trim() || !isAuthenticated || askMutation.isPending}
                                    onClick={() => askMutation.mutate(newQuestion)}
                                    className="rounded-full px-6 font-bold tracking-wide shadow-md bg-primary hover:bg-primary/90 text-white"
                                >
                                    {askMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Post Question"}
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Questions Feed */}
                <div className="space-y-8">
                    {isLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : filteredQuestions.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 border-dashed">
                            <MessageCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-500 font-semibold mb-1">No questions yet</p>
                            <p className="text-sm text-gray-400">Be the first to ask about this stay.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredQuestions.map(q => (
                                <motion.div
                                    key={q.id}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex gap-3 md:gap-4 relative"
                                >
                                    {/* Author Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold flex-none text-sm ring-4 ring-gray-50 z-10">
                                        {q.userFirstName?.[0]?.toUpperCase() || 'U'}
                                    </div>

                                    <div className="flex-1 min-w-0 bg-white p-5 rounded-2xl md:rounded-3xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                <span className="font-bold text-gray-900">{q.userFirstName} {q.userLastName}</span>
                                                <span className="text-xs text-gray-400 font-medium">· {formatDistanceToNow(new Date(q.createdAt))} ago</span>
                                            </div>
                                            {isOwner(q.userFirstName) && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900 rounded-full">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                        <DropdownMenuItem onClick={() => { setEditingQ(q.id); setEditQText(q.text); }}>
                                                            <Pencil className="w-4 h-4 mr-2" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => deleteQMutation.mutate(q.id)}>
                                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </div>

                                        {/* Question Body */}
                                        {editingQ === q.id ? (
                                            <div className="mt-2 flex gap-2">
                                                <Input value={editQText} onChange={e => setEditQText(e.target.value)} className="h-9 text-sm rounded-lg" />
                                                <Button size="sm" onClick={() => editQMutation.mutate({ id: q.id, text: editQText })}>Save</Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingQ(null)}>Cancel</Button>
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-gray-800 leading-relaxed text-[15px] font-medium">{q.text}</p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 mt-3">
                                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg font-bold text-xs"
                                                    onClick={() => setReplyingTo(replyingTo === q.id ? null : q.id)}
                                                >
                                                    <Reply className="w-4 h-4 mr-1.5" /> Reply
                                                </Button>
                                            </motion.div>
                                        </div>

                                        {/* Reply Input */}
                                        {replyingTo === q.id && isAuthenticated && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 flex gap-3 pb-2">
                                                <Input
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    placeholder="Write a reply..."
                                                    className="h-10 border-gray-200 rounded-full bg-gray-50 focus-visible:ring-1"
                                                    autoFocus
                                                />
                                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                    <Button onClick={() => replyMutation.mutate({ qId: q.id, text: replyText })} disabled={!replyText.trim()} className="rounded-full px-4 font-bold shadow-sm">
                                                        <Send className="w-4 h-4" />
                                                    </Button>
                                                </motion.div>
                                            </motion.div>
                                        )}

                                        {/* Answers / Replies Thread */}
                                        {q.answers.length > 0 && (
                                            <div className="mt-4 border-l-[3px] border-gray-100 ml-2 md:ml-4 sm:pl-4 pl-3 space-y-6 pt-2">
                                                {q.answers.map(a => (
                                                    <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group relative">
                                                        <div className="flex items-baseline justify-between mb-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-bold text-sm text-gray-900">{a.userFirstName} {a.userLastName}</span>
                                                                {a.isHost && <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full inline-flex items-center justify-center">Host</span>}
                                                                <span className="text-xs text-gray-400 font-medium tracking-tight">· {formatDistanceToNow(new Date(a.createdAt))} ago</span>
                                                            </div>
                                                            {isOwner(a.userFirstName) && (
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-900 rounded-full" onClick={() => { setEditingA(a.id); setEditAText(a.text); }}>
                                                                            <Pencil className="w-3 h-3" />
                                                                        </Button>
                                                                    </motion.div>
                                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500 rounded-full" onClick={() => deleteAMutation.mutate(a.id)}>
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </motion.div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {editingA === a.id ? (
                                                            <div className="mt-2 flex gap-2">
                                                                <Input value={editAText} onChange={e => setEditAText(e.target.value)} className="h-8 text-sm rounded-md" />
                                                                <Button size="sm" className="h-8 shadow-none" onClick={() => editAMutation.mutate({ id: a.id, text: editAText })}>Save</Button>
                                                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingA(null)}>Cancel</Button>
                                                            </div>
                                                        ) : (
                                                            <p className="text-[14.5px] text-gray-700 leading-relaxed font-medium">{a.text}</p>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </section>
    );
}
