"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = renderTemplate;
const handlebars_1 = __importDefault(require("handlebars"));
function renderTemplate(template, data) {
    const compiled = handlebars_1.default.compile(template);
    return compiled(data);
}
