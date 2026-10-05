/* Apply the saved visual theme before the stylesheet is parsed. */
(() => {
  let theme = 'dark';
  try {
    if (localStorage.getItem('nexlife_theme') === 'light') theme = 'light';
  } catch {
    // Keep the private, readable default when browser storage is unavailable.
  }
  document.documentElement.dataset.theme = theme;
})();
