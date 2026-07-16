"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useApplications = useApplications;
const react_query_1 = require("@tanstack/react-query");
const application_service_1 = require("@/services/application.service");
function useApplications(userId) {
    return (0, react_query_1.useQuery)({
        queryKey: ["applications", userId],
        queryFn: () => (0, application_service_1.listApplications)(userId),
        enabled: Boolean(userId),
    });
}
