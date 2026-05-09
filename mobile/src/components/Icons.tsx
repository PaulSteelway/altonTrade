import React from 'react';
import Svg, {
  Path,
  Circle,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
  ClipPath,
} from 'react-native-svg';

type IconProps = {size?: number; color?: string};

/** Bullcoin logo — gradient circle with bull silhouette, optional dark overlay */
export function BullcoinIcon({
  size = 160,
  darkOverlay = 0,
}: {
  size?: number;
  darkOverlay?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      <Rect
        width="160"
        height="160"
        rx="80"
        fill="url(#bullcoin_grad)"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M75.234 127.678C77.3487 132.043 82.6481 132.043 84.7628 127.678L112.292 87.8307C117.974 79.606 124.396 71.1909 125.355 61.2405C126.103 53.4876 123.31 46.7212 117.175 38.2427V43.7511C117.175 54.1633 113.146 54.1211 106.252 60.5313H53.7514C46.8576 54.1211 42.8283 54.1633 42.8283 43.7511V38.2427C36.6914 46.7245 33.8986 53.4929 34.6493 61.2495C35.6118 71.1936 42.0279 79.6038 47.7059 87.8241L75.234 127.678ZM75.201 107.622L75.2076 107.631L75.201 107.639V107.622L62.4587 91.3744L51.1212 77.2438C49.9978 74.9237 51.3854 71.9506 53.7378 71.9506H75.201V107.622ZM97.5411 91.3744L108.862 77.236C109.986 74.9159 108.598 71.9428 106.246 71.9428H84.7826V107.631L97.5411 91.3744Z"
        fill="white"
      />
      {darkOverlay > 0 && (
        <Rect
          width="160"
          height="160"
          rx="80"
          fill="black"
          opacity={darkOverlay}
        />
      )}
      <Defs>
        <LinearGradient
          id="bullcoin_grad"
          x1="29"
          y1="18.5"
          x2="144"
          y2="133.5"
          gradientUnits="userSpaceOnUse">
          <Stop stopColor="#E62159" />
          <Stop offset="1" stopColor="#801232" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

/** Gold point coin — exact port of frontend point.svg */
export function PointCoinIcon({size = 16}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.121 0H7.679V16h1.442C12.921 16 16 12.418 16 8S12.92 0 9.121 0z"
        fill="#DB7702"
      />
      <Path
        d="M7.679 15.566V16h1.442c1.614 0 3.097-.648 4.27-1.73L7.68 14.33v1.235z"
        fill="#DBA67F"
      />
      <Path
        d="M7.679 16c3.799 0 6.879-3.582 6.879-8S11.478 0 7.679 0C3.88 0 .8 3.582.8 8s3.08 8 6.879 8z"
        fill="#FECF75"
      />
      <Circle cx="7.679" cy="8" r="7.2" fill="#FEB425" />
      <Path
        d="M4.385 14.721l9.582-9.247c-.326-1.096-.856-2.094-1.54-2.924L2.225 12.429a7.04 7.04 0 002.16 2.292z"
        fill="#FFE3B9"
      />
      <Circle cx="7.832" cy="8.217" r="5.22" fill="#FFE3B9" />
      <Circle cx="7.679" cy="8" r="4.735" fill="#FEA724" />
    </Svg>
  );
}

/** Purple/blue coin — exact port of frontend coin.svg */
export function BalanceCoinIcon({size = 16}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M9.121 0H7.679V16h1.442C12.921 16 16 12.418 16 8S12.92 0 9.121 0z"
        fill="#66599D"
      />
      <Path
        d="M7.679 15.566V16h1.442c1.614 0 3.097-.648 4.27-1.73L7.68 14.33v1.235z"
        fill="#8F8DDD"
      />
      <Path
        d="M7.679 16c3.799 0 6.879-3.582 6.879-8S11.478 0 7.679 0C3.88 0 .8 3.582.8 8s3.08 8 6.879 8z"
        fill="#BAC1ED"
      />
      <Circle cx="7.679" cy="8" r="7.2" fill="#8B8ADB" />
      <Path
        d="M4.385 14.721l9.582-9.247c-.326-1.096-.856-2.094-1.54-2.924L2.225 12.429a7.04 7.04 0 002.16 2.292z"
        fill="#BAC1ED"
      />
      <Circle cx="7.832" cy="8.217" r="5.22" fill="white" />
      <Circle cx="7.679" cy="8" r="4.735" fill="#6C6AC4" />
    </Svg>
  );
}

/** Diamond gem — port of frontend diamond.svg */
export function DiamondIcon({size = 23}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 23 25" fill="none">
      <Path
        d="M8.012 5.343L4.62 8.736 2.968 11.93l.22 1.263 3.968-1.303 3.936-3.936 1.255-3.92-1.269-.098-3.066 1.407z"
        fill="#DCEDF4"
      />
      <Path d="M11.093 7.954l2.812 1.209 1.537-5.077-3.094-.052-1.255 3.92z" fill="#8CC6E5" />
      <Path
        d="M7.157 11.89l1.038 2.982 5.71-5.71-2.812-1.208-3.936 3.936z"
        fill="#9FD7ED"
      />
      <Path d="M3.09 16.446l5.105-1.573-1.038-2.982-3.968 1.303-.099 3.252z" fill="#8CC6E5" />
      <Path d="M16.71 17.724l-2.806-8.561-5.71 5.71 8.516 2.851z" fill="#4B8BBF" />
      <Path d="M16.71 17.724l-1.269-13.638-1.537 5.077 2.806 8.561z" fill="#62A4CC" />
      <Path d="M3.09 16.446l13.62 1.278-8.515-2.852-5.105 1.574z" fill="#62A4CC" />
    </Svg>
  );
}

/** fluent/arrow-left-24-filled — как на экране Profile TWA */
export function ArrowLeftIcon({size = 20, color = '#757F9C'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M12.727 3.687a1 1 0 010 1.4L7.833 10h12.334a1 1 0 010 2H7.833l4.894 4.913a1 1 0 01-1.414 1.414l-6.586-6.6a1 1 0 010-1.414l6.586-6.6a1 1 0 011.414 0z"
      />
    </Svg>
  );
}

/** fluent/crown-24-filled */
export function CrownIcon({size = 24, color = '#FEB425'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z"
        fill={color}
      />
    </Svg>
  );
}

/** fluent/wallet-24-filled */
export function WalletIcon({size = 20, color = '#ffffff'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M6 3a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3v-1.354A3.985 3.985 0 0022 15v-4a3.985 3.985 0 00-1-2.646V6a3 3 0 00-3-3H6zm14 6a2 2 0 00-2-2h-1v2h1a2 2 0 012 2v4a2 2 0 01-2 2h-1v2h1a2 2 0 002-2V9zM17 14a1 1 0 100-2 1 1 0 000 2z"
      />
    </Svg>
  );
}

/** fluent/clock-24-filled */
export function ClockIcon({size = 16, color = '#757F9C'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 5v4.586l2.707 2.707-1.414 1.414L11 12.414V7h2z"
      />
    </Svg>
  );
}

/** fluent/lock-closed-24-filled */
export function LockClosedIcon({size = 20, color = '#161C2C'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M12 2a5 5 0 00-5 5v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V11a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 7V7a3 3 0 116 0v2H9z"
      />
    </Svg>
  );
}

/** fluent/dismiss-24-filled (close X) */
export function DismissIcon({size = 22, color = '#D9D9D9'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M4.397 4.554l.073-.084a.75.75 0 01.976-.073l.084.073L12 10.939l6.47-6.47a.75.75 0 111.06 1.061L13.061 12l6.47 6.47a.75.75 0 01.072.976l-.073.084a.75.75 0 01-.976.073l-.084-.073L12 13.061l-6.47 6.47a.75.75 0 01-1.06-1.061L10.939 12l-6.47-6.47a.75.75 0 01-.072-.976z"
      />
    </Svg>
  );
}

/** fluent/video-24-filled (for ad button) */
export function VideoIcon({size = 20, color = '#ffffff'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="M4.25 4A2.25 2.25 0 002 6.25v11.5A2.25 2.25 0 004.25 20h11.5A2.25 2.25 0 0018 17.75v-3.5l3.22 2.577A.75.75 0 0022.5 16V8a.75.75 0 00-1.28-.827L18 9.75v-3.5A2.25 2.25 0 0015.75 4H4.25z"
      />
    </Svg>
  );
}

/** TicketDiagonal16Filled (spin ticket) */
export function TicketIcon({size = 16, color = '#7976E7'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        fill={color}
        d="M13.78 5.03a.75.75 0 00-1.06-1.06l-2.5 2.5-1.19-1.19a.75.75 0 00-1.06 1.06l1.72 1.72a.75.75 0 001.06 0l3.03-3.03zM2 4.5A1.5 1.5 0 013.5 3h9A1.5 1.5 0 0114 4.5v1.768a.75.75 0 01-.418.671A1.5 1.5 0 0012.5 8.5c0 .537.283 1.009.707 1.273a.75.75 0 01.37.65l.008.077v1.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 12v-1.768a.75.75 0 01.418-.671A1.5 1.5 0 003.5 8c0-.575-.324-1.074-.8-1.325a.75.75 0 01-.7-.675V4.5z"
      />
    </Svg>
  );
}

/**
 * Wallet-Full combo icon — port of frontend wallet-full.svg
 * Simplified representation: a red bag with three spinning coins + slot machine text
 */
export function WalletFullIcon({size = 60}: {size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 134 136" fill="none">
      {/* Three spinning coins (top area) */}
      {/* Top-right coin */}
      <Rect
        width="49.4"
        height="49.7"
        rx="24.7"
        transform="matrix(0.988 0.152 -0.15 0.989 37.8 0.19)"
        fill="url(#wf_g1)"
      />
      {/* Left coin */}
      <Rect
        width="49.4"
        height="49.7"
        rx="24.7"
        transform="matrix(0.965 -0.261 0.257 0.966 4.73 23.01)"
        fill="url(#wf_g2)"
      />
      {/* Right coin */}
      <Rect
        width="49.4"
        height="49.7"
        rx="24.7"
        transform="matrix(0.929 0.37 -0.365 0.931 82.03 15.38)"
        fill="url(#wf_g3)"
      />
      {/* Bag body */}
      <Path
        d="M105.9 136H3.69c-2.04 0-3.69-1.56-3.69-3.48V37.48C0 35.56 1.65 34 3.69 34h119.62c2.04 0 3.69 1.56 3.69 3.48V116.1C127 127.09 117.56 136 105.9 136z"
        fill="#BB204C"
      />
      {/* Bag shadow */}
      <Path
        d="M108.59 136H8.07c-2.4 0-4.35-1.84-4.35-4.11V38.29c0-2.27 1.95-4.11 4.35-4.11h117.85c2.4 0 4.35 1.84 4.35 4.11v77.21C130.28 126.82 120.57 136 108.59 136z"
        fill="#7E0326"
      />
      {/* Purple coin at center */}
      <Ellipse cx="63" cy="68" rx="11" ry="12" fill="#BAC1ED" />
      <Ellipse cx="63" cy="68" rx="8" ry="9" fill="#6C6AC4" />
      {/* Slot handle */}
      <Rect x="119" y="72" width="15" height="26" rx="4" fill="#2E4661" />
      <Defs>
        <LinearGradient id="wf_g1" x1="0" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#EF1C58" />
          <Stop offset="1" stopColor="#E62159" />
        </LinearGradient>
        <LinearGradient id="wf_g2" x1="0" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#EF1C58" />
          <Stop offset="1" stopColor="#E62159" />
        </LinearGradient>
        <LinearGradient id="wf_g3" x1="0" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#EF1C58" />
          <Stop offset="1" stopColor="#E62159" />
        </LinearGradient>
      </Defs>
    </Svg>
  );
}

/**
 * Wallet-Empty combo icon — port of frontend wallet-empty.svg
 * Same structure as wallet-full but greyed out
 */
export function WalletEmptyIcon({size = 60}: {size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 134 132" fill="none">
      {/* Bag body (greyed) */}
      <Path
        d="M105.54 132H3.68C1.65 132 0 130.47 0 128.58V35.14C0 33.25 1.65 31.71 3.68 31.71h119.2c2.03 0 3.68 1.53 3.68 3.42v77.3C126.56 123.24 117.15 132 105.54 132z"
        fill="#595959"
      />
      <Path
        d="M108.59 132H8.07c-2.4 0-4.35-1.81-4.35-4.05V35.77c0-2.23 1.95-4.06 4.35-4.06h117.85c2.4 0 4.35 1.83 4.35 4.06v73.73C130.28 120.82 120.57 132 108.59 132z"
        fill="#3D3D3D"
      />
      {/* Slot handle */}
      <Rect x="119" y="68.86" width="15" height="26" rx="4" fill="#2E4661" />
      {/* Purple coin (faded) */}
      <G opacity="0.32">
        <Ellipse cx="63" cy="66" rx="11" ry="12" fill="#BAC1ED" />
        <Ellipse cx="63" cy="66" rx="8" ry="9" fill="#6C6AC4" />
      </G>
    </Svg>
  );
}

/** Info (i in circle) — аналог Fluent Info20Filled для collection-info. */
export function Info20Icon({size = 20, color = '#ffffff'}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle
        cx="10"
        cy="10"
        r="7.75"
        stroke={color}
        strokeWidth={1.2}
        fill="none"
      />
      <Circle cx="10" cy="6.9" r="1.05" fill={color} />
      <Rect x="8.85" y="9.35" width="2.3" height="5.65" rx="0.45" fill={color} />
    </Svg>
  );
}

/** TON logo — same paths as web Wallet.tsx wallet-button SVG (24). */
export function TonRoundIcon({size = 24}: {size?: number}) {
  const clipId = React.useId().replace(/:/g, '_');
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G clipPath={`url(#${clipId})`}>
        <Path
          d="M12 24C18.6274 24 24 18.6274 24 12C24 5.37257 18.6274 0 12 0C5.37257 0 0 5.37257 0 12C0 18.6274 5.37257 24 12 24Z"
          fill="#0098EA"
        />
        <Path
          d="M16.0972 6.69751H7.9022C6.39543 6.69751 5.4404 8.32287 6.19846 9.63682L11.2561 18.4032C11.5862 18.9756 12.4133 18.9756 12.7433 18.4032L17.802 9.63682C18.559 8.32497 17.604 6.69751 16.0982 6.69751H16.0972ZM11.252 15.7743L10.1505 13.6425L7.49278 8.8891C7.31745 8.58485 7.53401 8.19498 7.90117 8.19498H11.251V15.7753L11.252 15.7743ZM16.5046 8.88807L13.8479 13.6435L12.7464 15.7743V8.19395H16.0962C16.4633 8.19395 16.6799 8.58382 16.5046 8.88807Z"
          fill="white"
        />
      </G>
      <Defs>
        <ClipPath id={clipId}>
          <Rect width="24" height="24" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

/** Alton gem — simplified from web Wallet.tsx voucher icon (32). */
export function AltonGemIcon({size = 32}: {size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.4153 30.9014C15.1181 32.3662 16.8792 32.3662 17.5819 30.9014L26.7302 17.5296C28.6185 14.7695 30.7526 11.9456 31.0715 8.60647C31.3199 6.00478 30.3917 3.73412 28.3531 0.888916V2.73743C28.3531 6.23152 27.0142 6.21736 24.7233 8.36847H7.27633C4.9854 6.21736 3.64641 6.23152 3.64641 2.73743V0.888916C1.607 3.73523 0.678912 6.00654 0.928392 8.60949C1.24823 11.9465 3.38043 14.7688 5.2673 17.5273L14.4153 30.9014ZM14.4044 24.1712L14.4066 24.174L14.4044 24.1766V24.1712L10.1699 18.7187L6.40227 13.9768C6.02895 13.1983 6.49006 12.2006 7.27183 12.2006H14.4044V24.1712ZM21.8284 18.7187L25.5906 13.9742C25.9639 13.1956 25.5028 12.1979 24.7211 12.1979H17.5885V24.174L21.8284 18.7187Z"
        fill="white"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.4066 24.174L14.4044 24.1712V24.1766L14.4066 24.174Z"
        fill="white"
      />
    </Svg>
  );
}
