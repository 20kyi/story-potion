import React from 'react';

const Button = ({ children, onClick, style, type = 'button', ...rest }) => (
    <button
        type={type}
        onClick={onClick}
        style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: '#fbeaea',
            color: '#cb6565',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(203,101,101,0.08)',
            ...style
        }}
        {...rest}
    >
        {children}
    </button>
);

export default Button; 