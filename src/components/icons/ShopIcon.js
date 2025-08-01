/*상점 아이콘*/

import React from 'react';

const ShopIcon = ({ width = 24, height = 24, color = '#181725' }) => (
    <svg width={width} height={height} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 12L12 4H36L42 12M6 12V40C6 41.0609 6.42143 42.0783 7.17157 42.8284C7.92172 43.5786 8.93913 44 10 44H38C39.0609 44 40.0783 43.5786 40.8284 42.8284C41.5786 42.0783 42 41.0609 42 40V12M6 12H42M32 20C32 22.1217 31.1571 24.1566 29.6569 25.6569C28.1566 27.1571 26.1217 28 24 28C21.8783 28 19.8434 27.1571 18.3431 25.6569C16.8429 24.1566 16 22.1217 16 20" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default ShopIcon; 