import { useState } from 'react';

interface ApplicationLogoProps {
    className?: string;
    size?: number; // Size in pixels (default: 170)
}

export default function ApplicationLogo({ className = '', size = 170 }: ApplicationLogoProps) {
    const [imageError, setImageError] = useState(false);

    const handleImageError = () => {
        setImageError(true);
    };

    if (imageError) {
        // Fallback to text logo
        return (
            <div className={`font-bold text-xl text-blue-600 ${className}`}>
                xPos
            </div>
        );
    }

    return (
        <img
            src="/logo.png"
            alt="ONYX xPos Logo"
            className={`${className}`}
            style={{ width: `${size}px`, height: `${size}px` }}
            onError={handleImageError}
        />
    );
}
