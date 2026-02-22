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

export function QASection({ homestayId }: { homestayId: string }) {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [searchQ, setSearchQ] = useState('');
    const [newQuestion, setNewQuestion] = useState('');

    // UI State for interactions
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
            toast.success('Question posted!');
            setNewQuestion('');
            queryClient.invalidateQueries({ queryKey: ['questions', homestayId] });
        }
    });

    const editQMutation = useMutation({
        mutationFn: async ({ id, text }: { id: string, text: string }) => await api.put(`/api/questions/${id}`, { text }),
        onSuccess: () => {
            setEditingQ(null);
            queryClient.invalidateQueries({ queryKey: ['questions', homestayId] });
        }
    });

    const deleteQMutation = useMutation({
        mutationFn: async (id: string) => await api.delete(`/api/questions/${id}`),
        onSuccess: () => {
            toast.success('Question deleted');
            queryClient.invalidateQueries({ queryKey: ['questions', homestayId] });
        }
    });

    const replyMutation = useMutation({
        mutationFn: async ({ qId, text }: { qId: string, text: string }) => await api.post(`/api/questions/${qId}/answers`, { text }),
        onSuccess: () => {
            setReplyingTo(null);
            setReplyText('');
            queryClient.invalidateQueries({ queryKey: ['questions', homestayId] });
        }
    });

    const editAMutation = useMutation({
        mutationFn: async ({ id, text }: { id: string, text: string }) => await api.put(`/api/answers/${id}`, { text }),
        onSuccess: () => {
            setEditingA(null);
            queryClient.invalidateQueries({ queryKey: ['questions', homestayId] });
        }
    });

    const deleteAMutation = useMutation({
        mutationFn: async (id: string) => await api.delete(`/api/answers/${id}`),
        onSuccess: () => {
            toast.success('Reply deleted');
            queryClient.invalidateQueries({ queryKey: ['questions', homestayId] });
        }
    });

    const filteredQuestions = questions.filter(q =>
        q.text.toLowerCase().includes(searchQ.toLowerCase()) ||
        q.answers.some(a => a.text.toLowerCase().includes(searchQ.toLowerCase()))
    );

    const isOwner = (firstName?: string) => user?.firstName === firstName || user?.role === 'ROLE_ADMIN';

    return (
        <div className="py-6 border-t border-border mt-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-extrabold text-foreground flex items-center gap-2 tracking-tight">
                    <MessageCircle className="w-6 h-6 text-primary" />
                    Community Q&A
                </h2>
                <div className="relative max-w-sm w-full">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search answers..."
                        value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        className="pl-9 bg-secondary/50 border-none focus-visible:ring-1 rounded-full"
                    />
                </div>
            </div>

            {/* Ask Box */}
            <div className="mb-10 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-none text-sm">
                    {isAuthenticated ? user?.firstName?.[0] : '?'}
                </div>
                <div className="flex-1 space-y-3">
                    <Textarea
                        placeholder={isAuthenticated ? "Ask the host or community a question..." : "Please log in to ask a question."}
                        value={newQuestion}
                        onChange={e => setNewQuestion(e.target.value)}
                        disabled={!isAuthenticated || askMutation.isPending}
                        className="resize-none min-h-[80px] bg-secondary/30 rounded-2xl border-border/50 focus-visible:ring-primary/20"
                    />
                    <div className="flex justify-end">
                        <Button
                            disabled={!newQuestion.trim() || !isAuthenticated || askMutation.isPending}
                            onClick={() => askMutation.mutate(newQuestion)}
                            className="rounded-full px-6 font-bold tracking-wide"
                        >
                            {askMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Post Question"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Questions Feed */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : filteredQuestions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10 font-medium">No questions match your search.</p>
                ) : (
                    <AnimatePresence>
                        {filteredQuestions.map(q => (
                            <motion.div
                                key={q.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex gap-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold flex-none text-sm mt-1">
                                    {q.userFirstName?.[0] || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-foreground">{q.userFirstName} {q.userLastName}</span>
                                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(q.createdAt))} ago</span>
                                        </div>
                                        {isOwner(q.userFirstName) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                    <DropdownMenuItem onClick={() => { setEditingQ(q.id); setEditQText(q.text); }}>
                                                        <Pencil className="w-4 h-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => deleteQMutation.mutate(q.id)}>
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>

                                    {/* Question Body */}
                                    {editingQ === q.id ? (
                                        <div className="mt-2 flex gap-2">
                                            <Input value={editQText} onChange={e => setEditQText(e.target.value)} className="h-9 text-sm" />
                                            <Button size="sm" onClick={() => editQMutation.mutate({ id: q.id, text: editQText })}>Save</Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingQ(null)}>Cancel</Button>
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-foreground/90 leading-relaxed text-[15px]">{q.text}</p>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-4 mt-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 px-2 text-muted-foreground hover:text-green-600 rounded-md"
                                            onClick={() => setReplyingTo(replyingTo === q.id ? null : q.id)}
                                        >
                                            <Reply className="w-4 h-4 mr-1.5" /> Reply
                                        </Button>
                                    </div>

                                    {/* Reply Input */}
                                    {replyingTo === q.id && isAuthenticated && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 flex gap-3">
                                            <Input
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
                                                placeholder="Write a reply..."
                                                className="h-10 border-border/50 rounded-xl"
                                                autoFocus
                                            />
                                            <Button onClick={() => replyMutation.mutate({ qId: q.id, text: replyText })} disabled={!replyText.trim()} className="rounded-xl px-4">
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </motion.div>
                                    )}

                                    {/* Answers / Replies Thread */}
                                    {q.answers.length > 0 && (
                                        <div className="mt-4 border-l-2 border-gray-100/80 dark:border-gray-800 ml-4 pl-4 space-y-4">
                                            {q.answers.map(a => (
                                                <div key={a.id} className="group relative">
                                                    <div className="flex items-baseline justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm text-foreground">{a.userFirstName} {a.userLastName}</span>
                                                            {a.isHost && <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">Host</span>}
                                                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.createdAt))} ago</span>
                                                        </div>
                                                        {isOwner(a.userFirstName) && (
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingA(a.id); setEditAText(a.text); }}>
                                                                    <Pencil className="w-3 h-3" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deleteAMutation.mutate(a.id)}>
                                                                    <Trash2 className="w-3 h-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {editingA === a.id ? (
                                                        <div className="mt-1.5 flex gap-2">
                                                            <Input value={editAText} onChange={e => setEditAText(e.target.value)} className="h-8 text-sm" />
                                                            <Button size="sm" className="h-8" onClick={() => editAMutation.mutate({ id: a.id, text: editAText })}>Save</Button>
                                                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingA(null)}>Cancel</Button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[14px] text-muted-foreground mt-0.5 leading-relaxed">{a.text}</p>
                                                    )}
                                                </div>
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
    );
}
