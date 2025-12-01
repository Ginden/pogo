export const percentOf = (v: number, max: number) =>
  Math.round((v / max) * 100) + "%";

export const capitalizeFirstLetter = ([firstLetter, ...s]: string) =>
  [firstLetter.toUpperCase(), ...s].join("");
