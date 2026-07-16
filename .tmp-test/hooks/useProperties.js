"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useProperties = useProperties;
const react_query_1 = require("@tanstack/react-query");
const property_service_1 = require("@/services/property.service");
function useProperties() {
    return (0, react_query_1.useQuery)({
        queryKey: ["properties"],
        queryFn: property_service_1.getProperties,
    });
}
