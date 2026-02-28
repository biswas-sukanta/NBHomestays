'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        role: 'ROLE_USER'
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [globalError, setGlobalError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});
        setGlobalError('');

        const newErrors: Record<string, string> = {};
        if (!formData.firstname.trim()) newErrors.firstname = "First name is required.";
        if (!formData.lastname.trim()) newErrors.lastname = "Last name is required.";
        if (!formData.email.trim()) newErrors.email = "Email is required.";
        if (!formData.password.trim() || formData.password.length < 6) newErrors.password = "Password must be at least 6 characters.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const res = await api.post('/api/auth/register', formData);
            login(res.data.accessToken, res.data.refreshToken);
            router.push('/');
        } catch (err: any) {
            setGlobalError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create your account</h2>
                </div>
                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    {globalError && <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg border border-red-100">{globalError}</div>}
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            name="firstname"
                            placeholder="First Name"
                            value={formData.firstname}
                            onChange={handleChange}
                            error={errors.firstname}
                        />
                        <Input
                            name="lastname"
                            placeholder="Last Name"
                            value={formData.lastname}
                            onChange={handleChange}
                            error={errors.lastname}
                        />
                    </div>
                    <Input
                        name="email"
                        type="email"
                        placeholder="Email address"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                    />
                    <Input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                    />
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">I want to:</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(val) => setFormData({ ...formData, role: val })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ROLE_USER">Book Homestays</SelectItem>
                                <SelectItem value="ROLE_HOST">Host a Homestay</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Sign up
                        </button>
                    </div>
                    <div className="text-center text-sm">
                        <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
