"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuthStore = void 0;
const zustand_1 = require("zustand");
exports.useAuthStore = (0, zustand_1.create)((set) => ({
    user: null,
    setUser: (user) => set({ user })
}));
