'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Application Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <h2 className="text-4xl font-bold text-red-600 mb-4">Something went wrong!</h2>
            <p className="text-gray-600 mb-8 max-w-md">
                We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
                <RefreshCcw className="w-4 h-4" />
                Try again
            </button>
        </div>
    );
}
