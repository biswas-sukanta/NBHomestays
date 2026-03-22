'use client';

import * as React from 'react';

interface HideOnErrorImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
}

export function HideOnErrorImage({ src, alt, style, ...props }: HideOnErrorImageProps) {
    const [hidden, setHidden] = React.useState(false);

    if (hidden) {
        return null;
    }

    return (
        <img
            src={src}
            alt={alt}
            style={style}
            onError={(e) => {
                e.currentTarget.style.display = 'none';
                setHidden(true);
            }}
            {...props}
        />
    );
}
