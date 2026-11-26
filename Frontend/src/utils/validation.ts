export const isValidPhone = (value: string): boolean => {
  const phone = value.trim();
  const digits = phone.replace(/\D/g, "");

  return (
    /^\+?[\d\s()-]{7,20}$/.test(phone) &&
    digits.length >= 7 &&
    digits.length <= 15
  );
};
