import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface IconProps {
    color?: string;
    size?: number;
}

export const EmailSupportIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
        <Rect x="2" y="4" width="20" height="16" rx="2" />
    </Svg>
);

export const CallUsIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z" />
        <Path d="M21 16v2a4 4 0 0 1-4 4h-5" />
    </Svg>
);

export const ChatSupportIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" />
        <Path d="M7 11h10" />
        <Path d="M7 15h6" />
        <Path d="M7 7h8" />
    </Svg>
);

export const ChevronRightIcon = ({ color = '#A0A0A0', size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="m9 18 6-6-6-6" />
    </Svg>
);
