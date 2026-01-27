/**
 * Claude Title Inspector - Run in console on Claude conversation
 */

(function inspectTitle() {
  console.log('=== CLAUDE TITLE INSPECTOR ===\n');

  // 1. Document title
  console.log('1. DOCUMENT TITLE:');
  console.log('  Raw:', document.title);
  console.log('  Cleaned:', document.title.replace(' - Claude', '').replace('Claude', '').trim());

  // 2. URL-based title
  console.log('\n2. URL:');
  console.log('  ', window.location.href);
  const urlMatch = window.location.pathname.match(/\/chat\/([^/?]+)/);
  if (urlMatch) {
    console.log('  Chat ID from URL:', urlMatch[1]);
  }

  // 3. Meta tags
  console.log('\n3. META TAGS:');
  ['og:title', 'twitter:title', 'title', 'description'].forEach(name => {
    const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    if (el) console.log(`  ${name}:`, el.content);
  });

  // 4. Try common title selectors
  console.log('\n4. COMMON TITLE SELECTORS:');
  const titleSelectors = [
    'h1',
    'header h1',
    '[class*="title"]',
    '[class*="conversation-title"]',
    '[class*="chat-title"]',
    'nav [class*="active"]',
    '[aria-current="page"]'
  ];

  titleSelectors.forEach(sel => {
    const els = document.querySelectorAll(sel);
    if (els.length > 0) {
      console.log(`\n  ${sel}: ${els.length} found`);
      Array.from(els).slice(0, 3).forEach((el, i) => {
        const text = el.textContent?.trim();
        if (text && text.length > 0 && text.length < 100) {
          console.log(`    [${i}] "${text}"`);
        }
      });
    }
  });

  // 5. Check sidebar for active conversation
  console.log('\n5. SIDEBAR ACTIVE CONVERSATION:');
  const sidebarSelectors = [
    'nav a[aria-current="page"]',
    'nav [class*="active"]',
    '[data-active="true"]',
    '.sidebar [class*="selected"]'
  ];

  sidebarSelectors.forEach(sel => {
    const el = document.querySelector(sel);
    if (el) {
      console.log(`  ${sel}:`);
      console.log(`    Text: "${el.textContent?.trim().substring(0, 80)}"`);
      console.log(`    Classes:`, el.className.substring(0, 80));
    }
  });

  // 6. Try to find conversation name by looking at first user message
  console.log('\n6. FALLBACK - FIRST USER MESSAGE:');
  const firstUser = document.querySelector('.font-user-message, [data-testid="user-message"]');
  if (firstUser) {
    const text = firstUser.innerText?.trim();
    const title = text.length > 50 ? text.substring(0, 50) + '...' : text;
    console.log('  First user message:', title);
  } else {
    console.log('  No user messages found');
  }

  console.log('\n=== END INSPECTOR ===');
  console.log('Copy all output and share with developer.');
})();
