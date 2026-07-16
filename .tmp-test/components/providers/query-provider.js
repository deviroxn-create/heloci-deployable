"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactQueryProvider = ReactQueryProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_query_1 = require("@tanstack/react-query");
function ReactQueryProvider({ children }) {
    const [queryClient] = (0, react_1.useState)(() => new react_query_1.QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 120000,
                gcTime: 300000,
                refetchOnWindowFocus: false,
                retry: 1
            }
        }
    }));
    return (0, jsx_runtime_1.jsx)(react_query_1.QueryClientProvider, { client: queryClient, children: children });
}
