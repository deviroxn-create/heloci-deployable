"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAddress = exports.currency = void 0;
const currency = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
exports.currency = currency;
const formatAddress = (address, city, state, zip) => `${address}, ${city}, ${state} ${zip}`;
exports.formatAddress = formatAddress;
