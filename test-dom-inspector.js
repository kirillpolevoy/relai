/**
 * DOM Inspector for Claude
 *
 * Instructions:
 * 1. Open Claude.ai in your browser with a conversation
 * 2. Open DevTools console (F12)
 * 3. Copy and paste this entire script into the console
 * 4. Press Enter
 * 5. Share the output with me
 */

(function inspectClaudeDOM() {
  console.log('=== CLAUDE DOM INSPECTOR ===\n');

  // Check for main/root containers
  console.log('1. ROOT CONTAINERS:');
  const rootSelectors = ['main', '[role="main"]', '#root', '[id^="app"]'];
  rootSelectors.forEach(sel => {
    const el = document.querySelector(sel);
    console.log(`  ${sel}: ${el ? '✓ FOUND' : '✗ not found'}`);
    if (el) console.log(`    Classes: ${el.className?.substring(0, 100)}`);
  });

  // Look for message-like elements by common patterns
  console.log('\n2. MESSAGE ELEMENT PATTERNS:');
  const messageSelectors = [
    '[data-testid*="message"]',
    '[class*="message"]',
    '[data-message-author-role]',
    '[class*="turn"]',
    '[role="article"]',
    '.font-user-message',
    '.font-claude-message'
  ];
  messageSelectors.forEach(sel => {
    const els = document.querySelectorAll(sel);
    console.log(`  ${sel}: ${els.length} found`);
  });

  // Sample data attributes
  console.log('\n3. DATA ATTRIBUTES (sampling first 20 divs):');
  const divsWithData = Array.from(document.querySelectorAll('div'))
    .filter(div => Array.from(div.attributes).some(attr => attr.name.startsWith('data-')))
    .slice(0, 20);

  const dataAttrs = new Set();
  divsWithData.forEach(div => {
    Array.from(div.attributes)
      .filter(a => a.name.startsWith('data-'))
      .forEach(a => dataAttrs.add(a.name));
  });
  console.log('  Unique data attributes found:', Array.from(dataAttrs));

  // Look for anything that looks like a conversation
  console.log('\n4. POTENTIAL MESSAGE CONTAINERS:');
  const allDivs = document.querySelectorAll('div');
  const potentialMessages = Array.from(allDivs).filter(div => {
    const text = div.innerText?.trim();
    const hasReasonableText = text && text.length > 20 && text.length < 5000;
    const hasLimitedChildren = div.children.length < 20;
    return hasReasonableText && hasLimitedChildren;
  }).slice(0, 5);

  console.log(`  Found ${potentialMessages.length} potential message divs (showing first 5):`);
  potentialMessages.forEach((div, i) => {
    console.log(`\n  Message ${i + 1}:`);
    console.log(`    Classes: ${div.className?.substring(0, 80)}`);
    console.log(`    Data attrs: ${Array.from(div.attributes)
      .filter(a => a.name.startsWith('data-'))
      .map(a => a.name)
      .join(', ') || 'none'}`);
    console.log(`    Text preview: ${div.innerText?.substring(0, 60)}...`);
    console.log(`    Parent classes: ${div.parentElement?.className?.substring(0, 60)}`);
  });

  console.log('\n=== END INSPECTOR ===');
  console.log('Please copy ALL of this output and share it.');
})();
