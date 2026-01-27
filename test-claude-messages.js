/**
 * Claude Message Structure Inspector
 *
 * Run this in console on a Claude conversation
 */

(function inspectMessages() {
  console.log('=== CLAUDE MESSAGE INSPECTOR ===\n');

  // Find all elements with data-testid containing "message"
  const messageEls = document.querySelectorAll('[data-testid*="message"]');
  console.log('Total elements with data-testid*="message":', messageEls.length);

  // Sample first 5 messages
  console.log('\nSampling first 5 messages:');
  Array.from(messageEls).slice(0, 5).forEach((el, i) => {
    console.log(`\n--- Message ${i + 1} ---`);
    console.log('data-testid:', el.getAttribute('data-testid'));
    console.log('Classes:', el.className);
    console.log('Text preview:', el.innerText?.substring(0, 60) + '...');
    console.log('Parent classes:', el.parentElement?.className);
    console.log('Has children:', el.children.length);
  });

  // Try to distinguish user vs assistant
  console.log('\n\n=== DISTINGUISHING USER VS ASSISTANT ===');

  // Check if there are different data-testid patterns
  const testIds = new Set();
  messageEls.forEach(el => {
    testIds.add(el.getAttribute('data-testid'));
  });
  console.log('Unique data-testid values:', Array.from(testIds));

  // Try to find assistant messages by other attributes
  console.log('\n=== LOOKING FOR ASSISTANT MESSAGES ===');

  const possibleAssistant = [
    '[class*="assistant"]',
    '[class*="claude"]',
    '[data-role="assistant"]',
    '[role="assistant"]'
  ];

  possibleAssistant.forEach(sel => {
    const els = document.querySelectorAll(sel);
    console.log(`${sel}: ${els.length} found`);
  });

  // Check parent containers
  console.log('\n=== CHECKING PARENT STRUCTURE ===');
  if (messageEls.length > 0) {
    const firstMsg = messageEls[0];
    let parent = firstMsg.parentElement;
    let depth = 0;

    console.log('Walking up DOM tree from first message:');
    while (parent && depth < 5) {
      console.log(`Level ${depth}:`, parent.tagName, parent.className.substring(0, 80));
      parent = parent.parentElement;
      depth++;
    }
  }

  console.log('\n=== END INSPECTOR ===');
})();
