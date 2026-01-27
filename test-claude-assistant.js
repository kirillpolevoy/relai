/**
 * Find Claude Assistant Messages
 */

(function findAssistant() {
  console.log('=== FINDING ASSISTANT MESSAGES ===\n');

  // We know user messages have this class
  const userMsgs = document.querySelectorAll('.font-user-message');
  console.log('User messages found:', userMsgs.length);

  // Try to find elements with "claude" in class that look like messages
  const claudeEls = document.querySelectorAll('[class*="claude"]');
  console.log('Total elements with "claude" in class:', claudeEls.length);

  // Filter to those that look like message containers (have reasonable text)
  const possibleAssistant = Array.from(claudeEls).filter(el => {
    const text = el.innerText?.trim();
    return text && text.length > 20 && text.length < 10000;
  });

  console.log('Filtered to message-sized elements:', possibleAssistant.length);
  console.log('\nSampling first 3:');

  possibleAssistant.slice(0, 3).forEach((el, i) => {
    console.log(`\n--- Candidate ${i + 1} ---`);
    console.log('Classes:', el.className.substring(0, 100));
    console.log('Text preview:', el.innerText?.substring(0, 80) + '...');
    console.log('Has data-testid:', el.hasAttribute('data-testid'));
    console.log('Parent classes:', el.parentElement?.className.substring(0, 80));
  });

  // Try looking for siblings of user messages
  console.log('\n\n=== CHECKING USER MESSAGE SIBLINGS ===');
  if (userMsgs.length > 0) {
    const firstUser = userMsgs[0];
    console.log('First user message parent:', firstUser.parentElement.className);
    console.log('Grandparent:', firstUser.parentElement.parentElement?.className);

    // Look at parent's siblings
    const parent = firstUser.parentElement.parentElement;
    if (parent) {
      console.log('\nSiblings of user message container:');
      Array.from(parent.children).slice(0, 5).forEach((child, i) => {
        const hasUserMsg = child.querySelector('.font-user-message');
        console.log(`Child ${i + 1}: ${hasUserMsg ? 'HAS USER MSG' : 'no user msg'} - classes:`, child.className.substring(0, 80));
        if (!hasUserMsg) {
          console.log('  Text preview:', child.innerText?.substring(0, 60) + '...');
        }
      });
    }
  }

  // Look for font-claude-message specifically
  console.log('\n\n=== SPECIFIC CLASS CHECKS ===');
  const specificClasses = [
    '.font-claude-message',
    '.font-assistant-message',
    '[class*="font-claude"]',
    '[class*="font-assistant"]'
  ];

  specificClasses.forEach(sel => {
    const els = document.querySelectorAll(sel);
    console.log(`${sel}: ${els.length} found`);
    if (els.length > 0 && els.length < 20) {
      console.log('  First element text:', els[0].innerText?.substring(0, 50) + '...');
    }
  });

  console.log('\n=== END ===');
})();
