// Desktop or mobile, for import instructions and for grouping parse problems.

export type DeviceType = "desktop" | "mobile";

type Nav = Pick<Navigator, "userAgent"> & { userAgentData?: { mobile?: boolean }; maxTouchPoints?: number };

export function detectDevice(nav: Nav): { type: DeviceType; userAgent: string } {
  // iPadOS Safari reports a Mac user agent; a touchscreen gives it away.
  const iPad = /Macintosh/.test(nav.userAgent) && (nav.maxTouchPoints ?? 0) > 1;
  const mobile = nav.userAgentData?.mobile ?? (iPad || /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent));
  return { type: mobile ? "mobile" : "desktop", userAgent: nav.userAgent.trim().slice(0, 500) || "unknown" };
}
