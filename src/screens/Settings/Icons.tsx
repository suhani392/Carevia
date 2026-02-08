import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

interface IconProps {
    color?: string;
    size?: number;
}

export const ProfileIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <Circle cx="12" cy="7" r="4" />
    </Svg>
);

export const LockIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Svg>
);

export const BellIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
);

export const PaletteIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <Circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <Circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <Circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <Path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.688-1.688h1.906c2.981 0 5.633-2.167 5.633-5.188C22 6.5 17.5 2 12 2z" />
    </Svg>
);

export const GlobeIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="12" r="10" />
        <Line x1="2" x2="22" y1="12" y2="12" />
        <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Svg>
);

export const ShieldIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </Svg>
);

export const FingerprintIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M2 12a10 10 0 0 1 18-6" />
        <Path d="M5 8a7 7 0 0 1 12 0" />
        <Path d="M8 10a4 4 0 0 1 8 0" />
        <Path d="M12 12v3" />
        <Path d="M12 20h.01" />
        <Path d="M17 12c0 2.5-2 4.5-4.5 4.5S8 14.5 8 12" />
    </Svg>
);

export const ChevronRightIcon = ({ color = '#A0A0A0', size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="m9 18 6-6-6-6" />
    </Svg>
);
