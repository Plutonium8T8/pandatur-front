export const getFullName = (firstName, lastName) => {
  return [firstName, lastName].filter(Boolean).join(" ")
}
