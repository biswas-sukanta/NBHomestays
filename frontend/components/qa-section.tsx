'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea'; // Assuming this exists or I'll use standard textarea
import { Loader2, MessageCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Question {
    id: string;
    questionText: string;
    answerText: string | null;
    answeredByOwner: boolean;
    createdAt: string;
    userFirstName: string | null;
    userLastName: string | null;
}

interface QASectionProps {
    homestayId: string;
}

export function QASection({ homestayId }: QASectionProps) {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [questionText, setQuestionText] = useState('');

    const { data: questions = [], isLoading } = useQuery({
        queryKey: ['questions', homestayId],
        queryFn: async () => {
            const res = await api.get(`/api/homestays/${homestayId}/questions`);
            return res.data as Question[];
        },
    });

    const askMutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await api.post(`/api/homestays/${homestayId}/ask`, { text });
            return res.data;
        },
        onMutate: async (newQuestionText) => {
            await queryClient.cancelQueries({ queryKey: ['questions', homestayId] });
            const previousQuestions = queryClient.getQueryData<Question[]>(['questions', homestayId]);

            // Optimistic update
            const optimisticQuestion: Question = {
                id: 'temp-' + Date.now(),
                questionText: newQuestionText,
                answerText: null,
                answeredByOwner: false,
                createdAt: new Date().toISOString(),
                userFirstName: user?.firstName || 'You',
                userLastName: user?.lastName || '',
            };

            queryClient.setQueryData<Question[]>(['questions', homestayId], (old = []) => [
                optimisticQuestion,
                ...old,
            ]);

            return { previousQuestions };
        },
        onError: (err: Error, newQuestion: string, context: { previousQuestions: Question[] | undefined } | undefined) => {
            queryClient.setQueryData(['questions', homestayId], context?.previousQuestions);
            toast.error('Failed to post question');
        },
        onSuccess: () => {
            toast.success('Question posted!');
            setQuestionText('');
            queryClient.invalidateQueries({ queryKey: ['questions', homestayId] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText.trim()) return;
        askMutation.mutate(questionText);
    };

    return (
        <div className="space-y-8 py-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <MessageCircle className="w-6 h-6" />
                Questions & Answers
            </h2>

            {/* Ask Form */}
            <div className="bg-gray-50 p-6 rounded-xl">
                {!isAuthenticated ? (
                    <div className="text-center py-4">
                        <p className="text-gray-600 mb-2">Login to ask a question to the host.</p>
                        {/* Assuming there's a way to trigger login or redirect */}
                        <Button variant="outline" asChild>
                            <a href="/login">Login to Ask</a>
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Ask the host a question
                        </label>
                        <Textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="Is there parking available?"
                            className="bg-white"
                            rows={3}
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                disabled={askMutation.isPending || !questionText.trim()}
                            >
                                {askMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Post Question
                            </Button>
                        </div>
                    </form>
                )}
            </div>

            {/* Questions List */}
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : questions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No questions yet. Be the first to ask!</p>
                ) : (
                    questions.map((q) => (
                        <div key={q.id} className="border-b border-gray-100 pb-6 last:border-0">
                            <div className="flex items-start gap-4">
                                <div className="bg-gray-100 p-2 rounded-full">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-semibold text-gray-900">
                                            {q.userFirstName} {q.userLastName}: {q.questionText}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {format(new Date(q.createdAt), 'MMM d, yyyy')}
                                        </span>
                                    </div>

                                    {q.answerText ? (
                                        <div className="bg-green-50 p-4 rounded-lg mt-3 border border-green-100">
                                            <p className="text-sm text-gray-800 font-medium mb-1">Host Response:</p>
                                            <p className="text-sm text-gray-600">{q.answerText}</p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">Waiting for response...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
