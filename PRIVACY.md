# Privacy Policy for Relai

**Last Updated:** January 27, 2026

## Overview

Relai is a Chrome extension designed with privacy as the #1 priority. This privacy policy explains how Relai handles your data.

## Data Collection

**Relai collects NO data.** Period.

## Data Storage

All conversation data captured by Relai is stored **locally in your browser** using IndexedDB. This data:

- **Never leaves your device**
- Is not transmitted to any external servers
- Is not uploaded to the cloud
- Is not shared with any third parties
- Is not accessible to the extension developers

## What Relai Does

Relai performs these operations entirely on your device:

1. **Extracts conversation text** from AI platform pages (ChatGPT, Claude, Gemini, Perplexity) when you click "Capture from this tab"
2. **Stores conversations locally** in your browser's IndexedDB
3. **Auto-pastes context** into AI platform input fields when you use the "Send to" feature

## What Relai Does NOT Do

- ❌ No external server communication
- ❌ No analytics or telemetry
- ❌ No tracking of any kind
- ❌ No cloud synchronization
- ❌ No data collection
- ❌ No cookies (other than browser's built-in storage)
- ❌ No user accounts or authentication
- ❌ No advertising or monetization

## Permissions Explained

Relai requests these permissions:

### storage
**Why:** Save captured conversations to your browser's local IndexedDB.
**Data access:** Local only, never transmitted.

### activeTab
**Why:** Read conversation messages from the currently active AI chat page when you click "Capture".
**Data access:** Only the current tab, only when you actively click the capture button.

### scripting
**Why:** Inject content scripts on AI platforms to extract messages and paste context.
**Data access:** Only on the 4 supported AI domains, only to read/write text in the chat interface.

### host_permissions
**Why:** Access the 4 supported AI platform domains to extract and inject conversation text.
**Domains:** chat.openai.com, chatgpt.com, claude.ai, gemini.google.com, perplexity.ai
**Data access:** Read conversation text, write to input fields. No other data accessed.

## Your Control

You have complete control over your data:

- **Export:** Download all your conversations as JSON at any time
- **Delete:** Clear all stored conversations with one click
- **Uninstall:** Removing the extension deletes all local data

## Open Source

Relai is open source. You can audit the code yourself:
https://github.com/kirillpolevoy/relai

Every line of code is visible and verifiable. There are no hidden data collection mechanisms.

## Third-Party Services

Relai does NOT use any third-party services:

- No Google Analytics
- No Sentry or error tracking
- No CDNs for code or assets
- No external APIs
- No authentication services

## Changes to This Policy

If this privacy policy changes, we will update the "Last Updated" date above. Since Relai collects no data, future changes would only make this policy more protective, not less.

## Contact

For questions about privacy or this policy:

- GitHub Issues: https://github.com/kirillpolevoy/relai/issues
- Email: [Your email if you want to provide one]

## Summary

**Relai is truly private:**
- All data stays on your device
- No external servers
- No tracking
- No data collection
- Open source code
- You are in complete control

Your conversations are yours alone.
