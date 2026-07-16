"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const ssr_1 = require("@supabase/ssr");
const server_1 = require("next/server");
const PROTECTED_PATHS = ["/applicant", "/staff", "/admin"];
async function middleware(request) {
    const pathname = request.nextUrl.pathname;
    // Only run auth check on protected routes
    if (!PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
        return server_1.NextResponse.next();
    }
    // Build a response we can mutate (to refresh session cookies)
    let response = server_1.NextResponse.next({
        request: { headers: request.headers }
    });
    const supabase = (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                // Write updated cookies onto both request and response
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = server_1.NextResponse.next({
                    request: { headers: request.headers }
                });
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            }
        }
    });
    // getUser() refreshes the session if needed
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirectTo", pathname);
        return server_1.NextResponse.redirect(loginUrl);
    }
    return response;
}
exports.config = {
    matcher: ["/applicant/:path*", "/staff/:path*", "/admin/:path*"]
};
