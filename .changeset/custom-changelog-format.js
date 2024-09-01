// @ts-check

/** @typedef {import('@changesets/types').ChangelogFunctions} ChangelogFunctions */

/** @type {ChangelogFunctions['getReleaseLine']} */
const getReleaseLine = async (
  { summary, commit, id, releases },
  versionType,
  changelogOpts
) => {
  const lines = summary
    .trim()
    .split('\n')
    .map((l) => l.trimEnd());

  const commitLine = `- ${commit}:`;

  const needsNewline =
    // bulleted lists
    lines[0].startsWith('- ') ||
    lines[0].startsWith('* ') ||
    // code blocks
    lines[0].startsWith('```') ||
    // numbered lists
    /^\d+\.\s/.test(lines[0]) ||
    // headings
    lines[0].startsWith('#');

  return (
    commitLine +
    (needsNewline ? '\n  ' : ' ') +
    lines.map((line, index) => (index === 0 ? line : `  ${line}`)).join('\n')
  );
};

/** @type {ChangelogFunctions['getDependencyReleaseLine']} */
const getDependencyReleaseLine = async (
  changesets,
  dependenciesUpdated,
  changelogOpts
) => {
  if (dependenciesUpdated.length === 0) return '';

  const updatedDepenenciesList = dependenciesUpdated.map(
    (dependency) => `  - ${dependency.name}@${dependency.newVersion}`
  );

  return ['- Updated dependencies:', ...updatedDepenenciesList].join('\n');
};

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
