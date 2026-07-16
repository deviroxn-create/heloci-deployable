"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRule = validateRule;
exports.explainRule = explainRule;
exports.testRule = testRule;
function validateRule(rule) {
    if (!rule || typeof rule !== "object")
        return false;
    return true;
}
function explainRule(rule) {
    if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
        return [];
    }
    const entries = Object.entries(rule);
    const explanation = [];
    for (const [operator, _operand] of entries) {
        if (operator === "and" || operator === "or") {
            explanation.push(`${operator.toUpperCase()} condition group`);
            continue;
        }
        if (operator === "==") {
            explanation.push("Equals");
            continue;
        }
        if (operator === ">=" || operator === ">" || operator === "<" || operator === "<=") {
            explanation.push("Comparison");
            continue;
        }
        if (operator === "in") {
            explanation.push("In list");
            continue;
        }
        if (operator === "score") {
            explanation.push("Adds score");
        }
    }
    return explanation;
}
function testRule(rule, _sampleProfile) {
    return {
        result: validateRule(rule),
        explanation: explainRule(rule)
    };
}
