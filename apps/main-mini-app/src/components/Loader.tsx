import React from 'react';

interface LoaderProps {
  /** Message shown below the spinner */
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = { sm: 20, md: 32, lg: 48 };

/**
 * Centered full-height loading spinner with optional message.
 */
export const Loader: React.FC<LoaderProps> = ({ message = 'Loading...', size = 'md' }) => {
  const px = sizeMap[size];

  return (
    <div className="loader-container">
      <div
        className="loader-spinner"
        style={{ width: px, height: px, borderWidth: size === 'sm' ? 2 : 3 }}
        role="status"
        aria-label={message}
      />
      {message && <p className="loader-message">{message}</p>}
    </div>
  );
};
