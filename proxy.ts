import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAuthorizedRedirectPath,
  getDefaultRedirectPath,
} from "@/lib/auth/redirects";

export const proxy = auth((request) => {
  const token = request.auth?.accessToken;
  const user = request.auth?.user ?? null;
  const { pathname } = request.nextUrl;

  const protectedPaths = ["/dashboard", "/admin", "/rm", "/accountant", "/account"];
  const isProtected = protectedPaths.some(path => pathname.startsWith(path));

  const authPaths = ["/login", "/register"];
  const isAuthPage = authPaths.some(path => pathname.startsWith(path));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtected && token) {
    const allowedPath = getAuthorizedRedirectPath(user, pathname);

    if (allowedPath !== pathname) {
      return NextResponse.redirect(new URL(allowedPath, request.url));
    }
  }

  if (isAuthPage && token) {
    const target = getDefaultRedirectPath(user);
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/rm/:path*",
    "/accountant/:path*",
    "/account/:path*",
    "/login",
    "/register",
  ],
};
