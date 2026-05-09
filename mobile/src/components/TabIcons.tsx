import React from 'react';
import Svg, {Path} from 'react-native-svg';

type IconProps = {
  color: string;
  size?: number;
};

/**
 * Иконки таб-бара — те же SVG, что `@fluentui/react-icons` на веб
 * ([BottomNavigation.tsx](frontend/src/BottomNavigation.tsx)):
 * CoinStack24Filled, Flash24Filled, HatGraduation24Filled, TableSimple24Filled, PeopleTeam24Filled.
 * Пути взяты из `@fluentui/react-icons/lib/sizedIcons/chunk-*.js`.
 */
export function TabIconHome({color, size = 24}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M19 7c0 2.76-3.13 5-7 5S5 9.76 5 7s3.13-5 7-5 7 2.24 7 5Zm-.38 3.37C17.18 11.96 14.75 13 12 13s-5.18-1.04-6.62-2.63A3.73 3.73 0 0 0 5 12c0 2.76 3.13 5 7 5s7-2.24 7-5c0-.57-.13-1.12-.38-1.63Zm0 5C17.18 16.96 14.75 18 12 18s-5.18-1.04-6.62-2.63A3.73 3.73 0 0 0 5 17c0 2.76 3.13 5 7 5s7-2.24 7-5c0-.57-.13-1.12-.38-1.63Z"
      />
    </Svg>
  );
}

export function TabIconBoosts({color, size = 24}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M7.43 2.83C7.6 2.33 8.07 2 8.6 2h6.46c.85 0 1.45.84 1.18 1.65L14.8 8h3.96c1.1 0 1.67 1.33.9 2.12L8.59 21.54c-1.06 1.08-2.88.1-2.55-1.38l1.27-5.66-1.56-.01c-1.21 0-2.05-1.2-1.65-2.34l3.33-9.32Z"
      />
    </Svg>
  );
}

export function TabIconAcademy({color, size = 24}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M5 17.75v-3.77l4.06 2.66a5.38 5.38 0 0 0 5.88 0L19 13.98v3.77c0 .16-.05.32-.15.45l-.01.02-.02.01v.02a3.4 3.4 0 0 1-.41.43c-.28.27-.7.61-1.25.96A9.7 9.7 0 0 1 12 21a9.7 9.7 0 0 1-5.16-1.36 7.43 7.43 0 0 1-1.68-1.42v-.01a.76.76 0 0 1-.16-.46Zm17.16-7.62-8.04 5.25a3.87 3.87 0 0 1-4.24 0L3 10.88v5.37a.75.75 0 0 1-1.5 0V10c0-.09.02-.17.04-.25a.75.75 0 0 1 .3-.88L9.92 3.7a3.87 3.87 0 0 1 4.18 0l8.06 5.17a.75.75 0 0 1 .01 1.26Z"
      />
    </Svg>
  );
}

export function TabIconMissions({color, size = 24}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M17.75 21h-5v-8.25H21v5c0 1.8-1.46 3.25-3.25 3.25ZM21 11.25h-8.25V3h5C19.55 3 21 4.46 21 6.25v5Zm-9.75 0V3h-5A3.25 3.25 0 0 0 3 6.25v5h8.25ZM3 12.75v5C3 19.55 4.46 21 6.25 21h5v-8.25H3Z"
      />
    </Svg>
  );
}

export function TabIconFriends({color, size = 24}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M14.75 10c.97 0 1.75.78 1.75 1.75v4.75a4.5 4.5 0 0 1-9 0v-4.75c0-.97.79-1.75 1.75-1.75h5.5Zm-7.62 0c-.35.42-.57.95-.62 1.53v4.97c0 .85.18 1.65.52 2.36A4 4 0 0 1 2 15v-3.24c0-.92.7-1.67 1.6-1.74l.15-.01h3.38Zm9.74 0h3.38c.97 0 1.75.78 1.75 1.75V15a4 4 0 0 1-5.03 3.87c.3-.63.48-1.32.53-2.06v-5.06c0-.67-.23-1.28-.63-1.75ZM12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm6.5 1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Zm-13 0a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"
      />
    </Svg>
  );
}
