const cheerio = require('cheerio');

function cleanHtmlForEditor(rawHtml) {
  const $ = cheerio.load(rawHtml);

  // ❌ Remove all script, style, head, meta, link, and nav elements
  $('script, style, head, meta, link, nav, footer').remove();

  // ✅ Keep images, headings, paragraphs, lists, spans, and buttons
  // You can expand the selector as needed

  const allowedTags = ['p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'img', 'strong', 'em', 'div', 'span', 'a', 'button', 'br'];

  // Strip all disallowed tags but keep content
  $('*').each((_, el) => {
    const tag = $(el).get(0).tagName.toLowerCase();
    if (!allowedTags.includes(tag)) {
      $(el).replaceWith($(el).html());
    }
  });

  // ✅ Keep only visible content (no hidden elements)
  $('[style*="display:none"], [hidden]').remove();

  return $('body').html() || '';
}

module.exports = cleanHtmlForEditor;