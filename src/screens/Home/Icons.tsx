import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

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

export const ProfileIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="12" cy="8" r="5" />
        <Path d="M20 21a8 8 0 0 0-16 0" />
    </Svg>
);

export const DropdownIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="m7 6 5 5 5-5" />
        <Path d="m7 13 5 5 5-5" />
    </Svg>
);

export const UploadIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 3v12" />
        <Path d="m17 8-5-5-5 5" />
        <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </Svg>
);

export const ReportIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 2h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8" />
        <Path d="M16.706 2.706A2.4 2.4 0 0 0 15 2v5a1 1 0 0 0 1 1h5a2.4 2.4 0 0 0-.706-1.706z" />
        <Path d="M5 7a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h8a2 2 0 0 0 1.732-1" />
    </Svg>
);

export const BotIcon = ({ color = '#3C87FF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 6V2H8" />
        <Path d="M15 11v2" />
        <Path d="M2 12h2" />
        <Path d="M20 12h2" />
        <Path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
        <Path d="M9 11v2" />
    </Svg>
);
export const BackIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="m12 19-7-7 7-7" />
        <Path d="M19 12H5" />
    </Svg>
);
export const CrossIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M18 6 6 18" />
        <Path d="m6 6 12 12" />
    </Svg>
);

export const ShareIcon = ({ color = '#000000', size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Circle cx="18" cy="5" r="3" />
        <Circle cx="6" cy="12" r="3" />
        <Circle cx="18" cy="19" r="3" />
        <Path d="M8.59 13.51 15.42 17.49" />
        <Path d="m15.41 6.51-6.82 3.98" />
    </Svg>
);

export const DownloadIcon = ({ color = '#000000', size = 20 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 17V3" />
        <Path d="m6 11 6 6 6-6" />
        <Path d="M19 21H5" />
    </Svg>
);

export const FlashlightIcon = ({ color = '#FFFFFF', size = 24 }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 13v1" />
        <Path d="M17 2a1 1 0 0 1 1 1v4a3 3 0 0 1-.6 1.8l-.6.8A4 4 0 0 0 16 12v8a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-8a4 4 0 0 0-.8-2.4l-.6-.8A3 3 0 0 1 6 7V3a1 1 0 0 1 1-1z" />
        <Path d="M6 6h12" />
    </Svg>
);

export const ScanFrameIcon = ({ color = '#FFFFFF', size = 300 }: IconProps) => (
    <Svg width={size} height={size * 1.33} viewBox="0 0 24 32" fill="none" stroke={color} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3 8V5a2 2 0 0 1 2-2h3" />
        <Path d="M16 3h3a2 2 0 0 1 2 2v3" />
        <Path d="M21 24v3a2 2 0 0 1-2 2h-3" />
        <Path d="M8 29H5a2 2 0 0 1-2-2v-3" />
    </Svg>
);
