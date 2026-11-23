import React from 'react';

/**
 * Renders distinct classic board game pawn shapes in SVG:
 * hat, car, dog, ship, boot, thimble.
 */
export function PawnIcon({ shape = 'hat', color = '#D62F2F', size = 20, className = '' }) {
  const normalizedShape = shape?.toLowerCase() || 'hat';

  const renderShapePath = () => {
    switch (normalizedShape) {
      case 'hat':
        return (
          // Top hat shape
          <g>
            {/* Brim */}
            <path d="M2 18C2 17 5 16 12 16C19 16 22 17 22 18C22 19.5 19 20 12 20C5 20 2 19.5 2 18Z" fill={color} stroke="#1B1B1B" strokeWidth="1.2" />
            {/* Crown */}
            <path d="M6 16L7 6C7 5 8 4 12 4C16 4 17 5 17 6L18 16Z" fill={color} stroke="#1B1B1B" strokeWidth="1.2" />
            {/* Ribbon */}
            <path d="M6.5 13.5H17.5V16H6.5Z" fill="#FDF8ED" opacity="0.6" />
          </g>
        );

      case 'car':
        return (
          // Vintage Roadster / Ambassador car
          <g>
            {/* Cabin */}
            <path d="M7 11L9 6H15L17 11H7Z" fill="#FDF8ED" stroke="#1B1B1B" strokeWidth="1" />
            {/* Body */}
            <path d="M3 11C3 10.5 4 10 6 10H18C20 10 21 10.5 21 11L22 14C22 15 21 16 20 16H4C3 16 2 15 2 14L3 11Z" fill={color} stroke="#1B1B1B" strokeWidth="1.2" />
            {/* Wheels */}
            <circle cx="6.5" cy="16.5" r="2.5" fill="#1B1B1B" />
            <circle cx="6.5" cy="16.5" r="1" fill="#FFFFFF" />
            <circle cx="17.5" cy="16.5" r="2.5" fill="#1B1B1B" />
            <circle cx="17.5" cy="16.5" r="1" fill="#FFFFFF" />
          </g>
        );

      case 'dog':
        return (
          // Royal Hound / Terrier
          <g>
            {/* Body & legs */}
            <path d="M6 18V13H8L11 11H16L18 8V6H20L19 10L16 12V18H14V14H10V18H6Z" fill={color} stroke="#1B1B1B" strokeWidth="1.2" />
            {/* Head / Ear */}
            <circle cx="19" cy="6" r="2" fill={color} />
            <path d="M19 4L17 7L18 8Z" fill="#1B1B1B" />
            {/* Tail */}
            <path d="M6 13L4 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );

      case 'ship':
        return (
          // Merchant Ship / Galleon
          <g>
            {/* Hull */}
            <path d="M3 15L5 20H19L21 15Z" fill={color} stroke="#1B1B1B" strokeWidth="1.2" />
            {/* Masts & Sails */}
            <line x1="8" y1="5" x2="8" y2="15" stroke="#1B1B1B" strokeWidth="1.5" />
            <line x1="14" y1="3" x2="14" y2="15" stroke="#1B1B1B" strokeWidth="1.5" />
            <path d="M8 6C11 7 11 11 8 12Z" fill="#FFFFFF" stroke="#1B1B1B" strokeWidth="0.8" />
            <path d="M14 4C18 5 18 10 14 12Z" fill="#FFFFFF" stroke="#1B1B1B" strokeWidth="0.8" />
          </g>
        );

      case 'boot':
        return (
          // Riding Boot
          <g>
            <path d="M7 4H13V12L17 14C19 15 20 16.5 20 18H5V16C5 14 6 13 7 12V4Z" fill={color} stroke="#1B1B1B" strokeWidth="1.2" />
            {/* Heel */}
            <path d="M5 18V20H8V18Z" fill="#1B1B1B" />
            {/* Sole */}
            <path d="M5 19H19V20H5Z" fill="#1B1B1B" />
          </g>
        );

      case 'thimble':
      default:
        return (
          // Chai Kulhad / Thimble
          <g>
            {/* Cup Body */}
            <path d="M6 6L8 18C8 19 10 20 12 20C14 20 16 19 16 18L18 6Z" fill={color} stroke="#1B1B1B" strokeWidth="1.2" />
            {/* Rim */}
            <ellipse cx="12" cy="6" rx="6" ry="2" fill="#FDF8ED" stroke="#1B1B1B" strokeWidth="1" />
            {/* Grips / Dimples */}
            <circle cx="10" cy="10" r="0.8" fill="#1B1B1B" opacity="0.4" />
            <circle cx="14" cy="10" r="0.8" fill="#1B1B1B" opacity="0.4" />
            <circle cx="12" cy="14" r="0.8" fill="#1B1B1B" opacity="0.4" />
          </g>
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`shrink-0 drop-shadow-md transition-transform ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {renderShapePath()}
    </svg>
  );
}
