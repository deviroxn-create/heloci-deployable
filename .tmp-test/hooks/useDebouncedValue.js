"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebouncedValue = useDebouncedValue;
const react_1 = require("react");
function useDebouncedValue(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = (0, react_1.useState)(value);
    (0, react_1.useEffect)(() => {
        const timer = window.setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => window.clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}
