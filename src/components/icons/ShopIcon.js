/*상점 아이콘*/

import React from 'react';

const ShopIcon = ({ width = 24, height = 24, color = '#181725' }) => (
    <svg width={width} height={height} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_875_970)">
            <path 
                d="M17.25 0.75H14.25L12.24 10.7925C12.1714 11.1378 11.9836 11.448 11.7093 11.6687C11.4351 11.8895 11.092 12.0067 10.74 12H3.45C3.09803 12.0067 2.75489 11.8895 2.48066 11.6687C2.20643 11.448 2.01859 11.1378 1.95 10.7925L0.750002 4.5H13.5M10.5 15.75C10.5 16.1642 10.8358 16.5 11.25 16.5C11.6642 16.5 12 16.1642 12 15.75C12 15.3358 11.6642 15 11.25 15C10.8358 15 10.5 15.3358 10.5 15.75ZM2.25 15.75C2.25 16.1642 2.58579 16.5 3 16.5C3.41421 16.5 3.75 16.1642 3.75 15.75C3.75 15.3358 3.41421 15 3 15C2.58579 15 2.25 15.3358 2.25 15.75Z" 
                stroke={color} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            />
        </g>
        <defs>
            <clipPath id="clip0_875_970">
                <rect width="18" height="18" fill="white" transform="matrix(-1 0 0 1 18 0)"/>
            </clipPath>
        </defs>
    </svg>
);

export default ShopIcon; 