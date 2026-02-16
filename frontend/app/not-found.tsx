'use client';

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">404 - Page Not Found</h2>
            <p className="text-gray-600 mb-8 max-w-md">
                The homestay or page you are looking for does not exist. It might have been removed or the link is broken.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
                Return Home
            </Link>
        </div>
    );
}
