import React from 'react';

const BeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c.102.043.204.085.306.127C12.42 4.4 14.88 5.617 16.5 7.5c1.62 1.883 2.16 4.143 2.16 6.347v1.85a2.25 2.25 0 0 1-2.25 2.25H7.5a2.25 2.25 0 0 1-2.25-2.25v-1.85c0-2.204.54-4.464 2.16-6.347C9.12 5.617 11.58 4.4 13.926 3.231c.102-.042.204-.084.306-.127m-4.47 0c-.09.042-.18.083-.27.126-1.584.84-2.913 2.05-3.693 3.496M18 14.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);
export default BeakerIcon;
