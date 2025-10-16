import { useState } from 'react';

interface ApplicationLogoProps {
    className?: string;
}

export default function ApplicationLogo({ className = '' }: ApplicationLogoProps) {
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
            onError={handleImageError}
        />
    );
}
