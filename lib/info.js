import parsers from './parsers'

export function githubRawPath(path) {
  const {user, repo, branch} = getRepoInfo();
  return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`
}

export async function fetchFile(path) {
  const ext = path.split('.').pop();


  if (!parsers[ext]) {
    throw new Error(`.${ext} file is not supported`);
  }

  try {
    const response = await fetch(githubRawPath(path));
    return await parsers[ext](response);
  } catch (e) {
    return null;
  }
}

export function getRepoInfo() {
  const [, user, repo] = window.location.pathname.split('/');
  const path = window.location.pathname;
  const matches = path.match(/tree\/([^?\/]+)/);
  const branch = matches && matches[1] || 'master';

  return { user, repo, branch };
}

export async function getBowerFile() {
  return await fetchFile('bower.json');
}

export async function getCircleciFile() {
  return await fetchFile('.circleci/config.yml');
}

export async function getMavenFile() {
  return await fetchFile('pom.xml');
}

export async function getNpmFile() {
  return await fetchFile('package.json');
}

export async function getTravisFile() {
  return await fetchFile('.travis.yml');
}

export async function getComposerFile() {
  return await fetchFile('composer.json');
}

export async function getPypiFile() {
  return await fetchFile('setup.py');
}

export async function getInfo() {
  const github = getRepoInfo();
  const npm = await getNpmFile();
  const travis = await getTravisFile();
  const maven = await getMavenFile();
  const circleCi = await getCircleciFile();
  const bower = await getBowerFile();
  const composer = await getComposerFile();
  const pypi = await getPypiFile();
  const configFiles  = {
    github,
    npm,
    travis,
    maven,
    circleCi,
    bower,
    composer,
    pypi,
  };

 return configFiles;
}

