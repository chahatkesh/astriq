function quoteFilePath(filePath) {
  return JSON.stringify(filePath);
}

const lintStagedConfig = {
  "*.{js,jsx,ts,tsx,mjs,cjs}": (filePaths) => {
    if (filePaths.length === 0) {
      return [];
    }

    return [`eslint --fix ${filePaths.map(quoteFilePath).join(" ")}`];
  },
};

export default lintStagedConfig;
