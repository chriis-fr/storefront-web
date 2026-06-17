export function ThemeScript() {
  const code = `
    try {
      var storedTheme = localStorage.getItem('storefront.theme');
      if (storedTheme) document.documentElement.dataset.theme = storedTheme;
    } catch (_) {}
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
