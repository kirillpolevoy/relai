/**
 * Title Inspector for Claude
 *
 * Run this in the console on a Claude conversation page
 */

(function inspectTitle() {
  console.log('=== CLAUDE TITLE INSPECTOR ===\n');

  // Check document.title
  console.log('1. DOCUMENT TITLE:');
  console.log('  document.title:', document.title);
  console.log('  After cleanup:', document.title.replace(' - Claude', '').replace('Claude', '').trim());

  // Check sidebar for active conversation
  console.log('\n2. SIDEBAR SELECTORS:');
  const sidebarSelectors = [
    '[class*="active"] [class*="truncate"]',
    'nav a[aria-current="page"]',
    '[class*="sidebar"] [class*="active"]',
    'nav [class*="active"]',
    '[aria-current="page"]'
  ];

  sidebarSelectors.forEach(sel => {
    const el = document.querySelector(sel);
    console.log(`  ${sel}:`, el ? `✓ "${el.textContent.trim().substring(0, 50)}..."` : '✗ not found');
  });

  // Check header/title area
  console.log('\n3. HEADER/TITLE AREA:');
  const headerSelectors = [
    'h1',
    'header h1',
    '[role="heading"]',
    '[class*="title"]',
    '[class*="conversation-title"]'
  ];

  headerSelectors.forEach(sel => {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      console.log(`  ${sel}: ${els.length} found`);
      Array.from(els).slice(0, 3).forEach((el, i) => {
        const text = el.textContent.trim();
        if (text && text.length > 0) {
          console.log(`    [${i}] "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`);
        }
      });
    }
  });

  // Check meta tags
  console.log('\n4. META TAGS:');
  const metaTags = ['og:title', 'twitter:title', 'title'];
  metaTags.forEach(name => {
    const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    if (el) {
      console.log(`  ${name}:`, el.content);
    }
  });

  // Try to find conversation name from URL pattern
  console.log('\n5. URL:');
  console.log('  ', window.location.href);
  const urlMatch = window.location.href.match(/\/chat\/([^/?]+)/);
  if (urlMatch) {
    console.log('  Chat ID:', urlMatch[1]);
  }

  console.log('\n=== END INSPECTOR ===');
})();
