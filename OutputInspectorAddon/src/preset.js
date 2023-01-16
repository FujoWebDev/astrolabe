function previewAnnotations(entry = []) {
  return [...entry, require.resolve("./manager")];
}

function managerEntries(entry = []) {
  return [...entry, require.resolve("./manager")];
}

export { managerEntries, previewAnnotations };
