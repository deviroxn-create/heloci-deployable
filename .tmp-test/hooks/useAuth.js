"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = useAuth;
const react_1 = require("react");
function useAuth() {
    const [user, setUser] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        setUser({ id: "guest", name: "Guest", email: "guest@example.com", role: "APPLICANT" });
    }, []);
    return { user };
}
