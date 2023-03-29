const path = require('path');
const read = require('@changesets/read').default;
const fs = require('fs').promises;

(async () => {
  const changesetFiles = await read(process.cwd());

  for (const changeset of changesetFiles) {
    console.log('writing "%s.md"', changeset.id);

    const releases = changeset.releases.filter(
      (item) => item.name !== 'jsxstyle'
    );

    const releaseType = releases
      .map((value) => value.type)
      .reduce((prev, curr) => {
        if (prev === 'major' || curr === 'major') return 'major';
        if (prev === 'minor' || curr === 'minor') return 'minor';
        if (prev === 'patch' || curr === 'patch') return 'patch';
        return prev;
      });

    releases.unshift({
      name: 'jsxstyle',
      type: releaseType,
    });

    const newContent = [
      '---',
      ...releases.map((release) => `'${release.name}': ${release.type}`),
      '---',
      '',
      changeset.summary,
      '',
    ].join('\n');

    fs.writeFile(
      path.join(process.cwd(), '.changeset', changeset.id + '.md'),
      newContent
    );
  }
})();
