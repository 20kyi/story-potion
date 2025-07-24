import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// 앱 시작 시 저장된 폰트 적용
const savedFont = localStorage.getItem('fontFamily');
if (savedFont) {
    document.body.style.fontFamily = savedFont;
} 