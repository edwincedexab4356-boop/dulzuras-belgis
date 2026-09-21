import React from 'react';

interface BelgisLogoProps {
  className?: string;
  size?: number | string;
  showDetails?: boolean;
}

export const BelgisLogo: React.FC<BelgisLogoProps> = ({
  className = '',
  size = 64,
  showDetails = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="pinkGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f4258e" />
            <stop offset="85%" stopColor="#e11479" />
            <stop offset="100%" stopColor="#c80766" />
          </radialGradient>
          <filter id="logoShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Lime Green Ring */}
        <circle cx="250" cy="250" r="245" fill="#8bee00" stroke="#72c800" strokeWidth="3" />

        {/* Inner Fuchsia/Pink Disc */}
        <circle cx="250" cy="250" r="215" fill="url(#pinkGrad)" />

        {/* White Dashed Stitching Ring */}
        <circle
          cx="250"
          cy="250"
          r="200"
          stroke="#ffffff"
          strokeWidth="4"
          strokeDasharray="10 8"
          fill="none"
          opacity="0.9"
        />

        {/* Lime cloud backing behind cupcake */}
        <path
          d="M 175 190 C 150 160, 100 200, 115 240 C 95 270, 120 310, 150 315 C 180 340, 230 325, 245 295 C 275 305, 305 270, 290 235 C 310 195, 265 170, 235 190 Z"
          fill="#a3f71c"
          opacity="0.95"
        />

        {/* Black Cupcake Base and Frosting Swirl */}
        <g filter="url(#logoShadow)">
          {/* Swirl top */}
          <path
            d="M 235 125 C 240 120, 250 145, 230 165 C 210 185, 175 195, 160 215 C 145 235, 160 260, 195 260 C 235 260, 245 220, 225 200 C 210 185, 220 165, 235 150 C 245 140, 255 130, 235 125 Z"
            fill="#111111"
          />
          {/* Additional swirl flame/cream layers */}
          <path
            d="M 215 135 C 190 155, 175 195, 185 225 C 195 255, 230 260, 220 275 C 205 295, 170 280, 160 265 C 140 235, 165 180, 215 135 Z"
            fill="#111111"
          />
          {/* Cup bottom */}
          <path
            d="M 160 270 L 175 340 C 180 355, 235 355, 245 340 L 265 270 C 230 285, 190 285, 160 270 Z"
            fill="#111111"
          />
          {/* Cupcake glossy light highlights */}
          <path
            d="M 180 205 C 175 220, 180 235, 190 240 C 185 230, 182 215, 180 205 Z"
            fill="#555555"
            opacity="0.6"
          />
        </g>

        {/* Text: "Dulzuras" Script */}
        <text
          x="345"
          y="200"
          textAnchor="middle"
          fill="#ffffff"
          stroke="#111111"
          strokeWidth="6"
          paintOrder="stroke fill"
          fontFamily="'Playfair Display', cursive, serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="56"
          letterSpacing="1"
        >
          Dulzuras
        </text>

        {/* Text: "de" Script */}
        <text
          x="350"
          y="245"
          textAnchor="middle"
          fill="#ffffff"
          stroke="#111111"
          strokeWidth="4"
          paintOrder="stroke fill"
          fontFamily="'Playfair Display', cursive, serif"
          fontWeight="bold"
          fontStyle="italic"
          fontSize="36"
        >
          de
        </text>

        {/* Text: "Belgi's" Script */}
        <text
          x="345"
          y="315"
          textAnchor="middle"
          fill="#ffffff"
          stroke="#111111"
          strokeWidth="7"
          paintOrder="stroke fill"
          fontFamily="'Playfair Display', cursive, serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="72"
          letterSpacing="0.5"
        >
          Belgi&apos;s
        </text>

        {showDetails && (
          <>
            {/* Slogan */}
            <text
              x="250"
              y="370"
              textAnchor="middle"
              fill="#ffffff"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontWeight="700"
              fontStyle="italic"
              fontSize="20"
              letterSpacing="0.5"
            >
              Repostería para todos tus eventos!!
            </text>

            {/* Lime Swoosh Under Slogan */}
            <path
              d="M 205 385 Q 250 375 295 385 Q 250 380 205 385 Z"
              fill="#8bee00"
            />

            {/* Email Icon and Text */}
            <g transform="translate(145, 400)">
              <rect x="0" y="2" width="16" height="11" rx="2" fill="none" stroke="#ffffff" strokeWidth="1.5" />
              <path d="M 0 3 L 8 9 L 16 3" stroke="#ffffff" strokeWidth="1.5" fill="none" />
              <text
                x="22"
                y="12"
                fill="#ffffff"
                fontFamily="'Plus Jakarta Sans', sans-serif"
                fontWeight="600"
                fontSize="13"
              >
                E-Mail: dulzurasdebelgis@gmail.com
              </text>
            </g>
          </>
        )}
      </svg>
    </div>
  );
};
