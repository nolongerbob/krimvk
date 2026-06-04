'use client';

import Script from 'next/script';

/**
 * Сбрасывает старые cookie BVI до React — иначе при прошлой автозагрузке плагина
 * ломается DOM (белый экран, Unexpected token '<' в чанках).
 */
export function BviPlugin() {
  return (
    <Script
      id="bvi-cookie-reset"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
(function () {
  try {
    document.cookie.split(';').forEach(function (part) {
      var name = part.split('=')[0];
      if (name && name.trim().indexOf('bvi_') === 0) {
        var n = name.trim();
        document.cookie = n + '=;path=/;max-age=0';
        if (location.hostname) {
          document.cookie = n + '=;path=/;max-age=0;domain=' + location.hostname;
        }
      }
    });
  } catch (e) {}
})();
        `.trim(),
      }}
    />
  );
}
