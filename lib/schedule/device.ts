// Desktop or mobile, for import instructions and for grouping parse problems.

export type DeviceType = "desktop" | "mobile";

export function detectDevice(nav: Pick<Navigator, "userAgent"> & { userAgentData?: { mobile?: boolean } }): {
  type: DeviceType;
  userAgent: string;
} {
  const mobile = nav.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);
  return { type: mobile ? "mobile" : "desktop", userAgent: nav.userAgent.trim().slice(0, 500) || "unknown" };
}
