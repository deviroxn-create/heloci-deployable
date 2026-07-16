export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export const formatAddress = (address: string, city: string, state: string, zip: string) =>
  `${address}, ${city}, ${state} ${zip}`;
