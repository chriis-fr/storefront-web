// Applies the saved (or system) colour mode before first paint so there is no
// flash of the wrong theme. Adds the `dark` class to <html>, which globals.css
// keys its dark tokens off. Keeps the legacy data-theme preset support too.
export function ThemeScript() {
  const code = `
    try {
      var mode = localStorage.getItem('storefront.mode');
      if (!mode) mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (mode === 'dark') document.documentElement.classList.add('dark');
      var preset = localStorage.getItem('storefront.theme');
      if (preset) document.documentElement.dataset.theme = preset;
    } catch (_) {}
  `;

  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
