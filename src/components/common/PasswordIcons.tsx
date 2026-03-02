import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface IconProps {
    color?: string;
    size?: number;
}

export const EyeIcon = ({ color = '#0062FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
        <Circle cx="12" cy="12" r="3" />
    </Svg>
);

export const EyeClosedIcon = ({ color = '#0062FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="m15 18-.722-3.25" />
        <Path d="M2 8a10.645 10.645 0 0 0 20 0" />
        <Path d="m20 15-1.726-2.05" />
        <Path d="m4 15 1.726-2.05" />
        <Path d="m9 18 .722-3.25" />
    </Svg>
);
