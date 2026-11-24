import { authkitProxy } from "@workos-inc/authkit-nextjs";

export default authkitProxy({
  // The schedule API runs withAuth(), so it must be covered by the proxy; it's
  // listed as unauthenticated so the middleware lets it through to return its
  // own 401 instead of redirecting to sign-in.
  middlewareAuth: { enabled: true, unauthenticatedPaths: ["/api/schedule/:path*"] },
});

export const config = {
  matcher: [
    "/api/schedule/:path*",
    "/friends/:path*",
    "/matches/:path*",
    "/me/:path*",
    "/my-week/:path*",
    "/profile/:path*",
  ],
};
