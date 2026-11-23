import { authkitProxy } from "@workos-inc/authkit-nextjs";

export default authkitProxy({
  middlewareAuth: { enabled: true, unauthenticatedPaths: [] },
});

export const config = {
  matcher: [
    "/friends/:path*",
    "/matches/:path*",
    "/me/:path*",
    "/my-week/:path*",
    "/profile/:path*",
  ],
};
