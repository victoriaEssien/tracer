import { ImageResponse } from "next/og";

import { BRAND, markDataUri } from "@/config/site";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * The home-screen icon. Square and full bleed: iOS rounds the corners itself,
 * and an icon that rounds them too ends up with a visible double radius.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.ink,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markDataUri()} alt="" width={110} height={105} />
      </div>
    ),
    size,
  );
}
