
export function assetUrl(publicPath) {
  const path = publicPath.startsWith('/') ? publicPath : `/${publicPath}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return new URL(path, window.location.origin).href;
  }
  return path;
}

export const ASSETS = {
  get LOGO() {
    return assetUrl('/images/logo.png');
  },
  get LOGO_B() {
    return assetUrl('/images/logob.png');
  },
  get LOBBY_BG() {
    return assetUrl('/images/lobby-main.jpg');
  },
  get CUBES_BG() {
    return assetUrl('/images/cubes-bg.jpg');
  },
};

export function applyThemeImageVars() {
  document.documentElement.style.setProperty('--img-lobby', `url("${ASSETS.LOBBY_BG}")`);
  document.documentElement.style.setProperty('--img-cubes', `url("${ASSETS.CUBES_BG}")`);
}