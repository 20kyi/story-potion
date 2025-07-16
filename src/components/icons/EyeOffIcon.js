import React from 'react';

function EyeOffIcon({ width = 24, height = 24, color = '#888' }) {
    return (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.94 17.94C16.13 19.23 14.13 19.97 12 19.97C7.11 19.97 2.73 16.86 1 12.47C1.73 10.61 2.97 8.97 4.56 7.74M9.53 4.56C10.33 4.37 11.16 4.27 12 4.27C16.89 4.27 21.27 7.38 23 11.77C22.37 13.32 21.37 14.7 20.06 15.82M1 1L23 23" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="2" />
        </svg>
    );
}

export default EyeOffIcon; 