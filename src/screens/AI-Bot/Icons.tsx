import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

interface IconProps {
    color?: string;
    size?: number;
}

export const MenuIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 5h16" />
        <Path d="M4 12h16" />
        <Path d="M4 19h16" />
    </Svg>
);

export const CrossIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6 6 18" />
        <Path d="m6 6 12 12" />
    </Svg>
);

export const AttachIcon = ({ color = '#000000', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" />
    </Svg>
);

export const SendIcon = ({ color = '#000000', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
        <Path d="m21.854 2.147-10.94 10.939" />
    </Svg>
);

export const LinkIcon = ({ color = '#0062FF', size = 16 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 17H7A5 5 0 0 1 7 7h2" />
        <Path d="M15 7h2a5 5 0 1 1 0 10h-2" />
        <Line x1="8" x2="16" y1="12" y2="12" />
    </Svg>
);
