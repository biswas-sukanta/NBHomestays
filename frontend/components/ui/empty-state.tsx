import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode;
    title: string;
    description: string;
}

export function EmptyState({ icon, title, description, className, ...props }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "bg-white border rounded-3xl p-12 text-center max-w-3xl mx-auto shadow-sm w-full",
                className
            )}
            {...props}
        >
            {icon && (
                <div className="flex justify-center mb-4 text-muted-foreground/30">
                    {icon}
                </div>
            )}
            <h3 className="text-xl font-bold text-foreground mb-2">
                {title}
            </h3>
            <p className="text-muted-foreground">
                {description}
            </p>
        </div>
    );
}
