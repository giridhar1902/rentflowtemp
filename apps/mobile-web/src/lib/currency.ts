type CurrencyValue = string | number | null | undefined;

type CurrencyFormatOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

const toNumber = (value: CurrencyValue) => Number(value ?? 0);

export const formatINR = (
  value: CurrencyValue,
  options: CurrencyFormatOptions = {},
) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: options.minimumFractionDigits ?? 2,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(toNumber(value));

export const formatINRWhole = (value: CurrencyValue) =>
  formatINR(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
