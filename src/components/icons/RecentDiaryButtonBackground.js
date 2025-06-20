import React from 'react';

const RecentDiaryButtonBackground = (props) => (
    <svg width="100%" height="100%" viewBox="0 0 700 580" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" {...props}>
        <g filter="url(#filter1_diii_692_462)">
            <rect x="256" y="200" width="243" height="124" rx="30" fill="url(#paint2_linear_692_462)" fillOpacity="0.3" shapeRendering="crispEdges" />
            <rect x="253" y="197" width="249" height="130" rx="33" stroke="url(#paint3_linear_692_462)" strokeOpacity="0.5" strokeWidth="6" shapeRendering="crispEdges" />
        </g>
        <defs>
            <filter id="filter1_diii_692_462" x="0" y="44" width="655" height="536" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dx="-50" dy="50" />
                <feGaussianBlur stdDeviation="100" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0.00392157 0 0 0 0 0.480065 0 0 0 0 0.611765 0 0 0 0.15 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_692_462" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_692_462" result="shape" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dx="-5" dy="-5" />
                <feGaussianBlur stdDeviation="10" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0" />
                <feBlend mode="normal" in2="shape" result="effect2_innerShadow_692_462" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="4" />
                <feGaussianBlur stdDeviation="100" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0.733333 0 0 0 0 1 0 0 0 0.2 0" />
                <feBlend mode="normal" in2="effect2_innerShadow_692_462" result="effect3_innerShadow_692_462" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="10" />
                <feGaussianBlur stdDeviation="25" />
                <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0" />
                <feBlend mode="normal" in2="effect3_innerShadow_692_462" result="effect4_innerShadow_692_462" />
            </filter>
            <linearGradient id="paint2_linear_692_462" x1="458.176" y1="210.292" x2="379.136" y2="381.01" gradientUnits="userSpaceOnUse">
                <stop stopColor="#E7FBFF" />
                <stop offset="0.535505" stopColor="white" />
                <stop offset="1" stopColor="#DBF6FF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="paint3_linear_692_462" x1="480.532" y1="314.204" x2="269.925" y2="323.714" gradientUnits="userSpaceOnUse">
                <stop stopColor="#00D9FF" stopOpacity="0.2" />
                <stop offset="0.115385" stopColor="#00D9FF" stopOpacity="0.03" />
                <stop offset="0.365385" stopColor="white" stopOpacity="0.3" />
                <stop offset="0.490385" stopColor="white" stopOpacity="0.03" />
                <stop offset="0.899038" stopColor="#97F4FE" stopOpacity="0" />
                <stop offset="1" stopColor="#00D5FF" stopOpacity="0.15" />
            </linearGradient>
        </defs>
    </svg>
);

export default RecentDiaryButtonBackground; 