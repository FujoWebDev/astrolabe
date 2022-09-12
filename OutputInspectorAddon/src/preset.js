export function managerEntries(entry = []) {
  return [...entry, require.resolve("./manager")]; //👈 Addon implementation
}
