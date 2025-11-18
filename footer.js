// Единый футер для всех страниц olgaroset.ru
// Автоматически загружается и вставляется в <div id="footer"></div>

document.addEventListener('DOMContentLoaded', function() {
  const footerContainer = document.getElementById('footer');
  if (!footerContainer) return;
  
  // Cache-busting: добавляем timestamp
  const version = Date.now();
  
  fetch(`/footer.html?v=${version}`)
    .then(response => response.text())
    .then(html => {
      footerContainer.innerHTML = html;
    })
    .catch(error => {
      console.error('Ошибка загрузки футера:', error);
      // Fallback
      footerContainer.innerHTML = `
        <footer>
        <a href="https://t.me/olgarozet">Telegram</a><br>
        <a href="https://www.instagram.com/olga_rozet/">Instagram</a><br>
        <a href="mailto:o.g.rozet@gmail.com">Email</a>
        </footer>
      `;
    });
});

