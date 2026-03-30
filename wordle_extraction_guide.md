# NYT Wordle State Extraction Guide

This document contains everything we have discovered about how the New York Times Wordle game saves player progress, and how to reliably extract it using a React Native WebView. 

You can use this reference to build "The Heist" mechanism from scratch without hitting the white-screen WebView errors we encountered.

## 1. Where Does Wordle Save Data?

The game state is saved in the browser's `localStorage` under a specific key:
**Key:** `nyt-wordle-state`

Every time a user guesses a word, the NYT app updates a JSON string stored inside this key. 

## 2. Exact JSON Schema for `nyt-wordle-state`

When you run `JSON.parse(window.localStorage.getItem('nyt-wordle-state'))`, you get the following structure:

```json
{
  "boardState": ["HELLO", "WORLD", "", "", "", ""],
  "evaluations": [
    ["absent", "present", "absent", "absent", "present"],
    ["absent", "correct", "absent", "absent", "absent"],
    null,
    null,
    null,
    null
  ],
  "rowIndex": 2,
  "solution": "TOUGH",
  "gameStatus": "IN_PROGRESS",
  "lastCompletedTs": null,
  "lastPlayedTs": 1774847040432,
  "hardMode": false,
  "gameId": 1745,
  "dayOffset": 2824
}
```

### Key Properties to Extract
- **`gameStatus`**: Tells you if the game is over. 
  - `"IN_PROGRESS"` = The user is still playing.
  - `"WIN"` = The user guessed the word correctly.
  - `"FAIL"` = The user ran out of guesses.
- **`rowIndex`**: The exact number of guesses the user has made. If `gameStatus === 'WIN'`, this is their final score.
- **`boardState`**: Array of the actual words they guessed.

## 3. How to Extract it via React Native WebView

Instead of trying to hack the NYT React components, the easiest way to extract the data is by injecting a small polling script inside the `<WebView>` using the `injectedJavaScript` prop.

```javascript
const INJECTED_JAVASCRIPT = \`
  // 1. Create a variable to track the previous state so we don't spam messages
  let lastReportedStatus = 'IN_PROGRESS';

  // 2. Poll the localStorage every 2 seconds
  setInterval(() => {
    try {
      const stateStr = window.localStorage.getItem('nyt-wordle-state');
      if (stateStr) {
        const state = JSON.parse(stateStr);
        
        // 3. If the game status changes to WIN or FAIL, send it to React Native
        if (state.gameStatus && state.gameStatus !== 'IN_PROGRESS' && state.gameStatus !== lastReportedStatus) {
          lastReportedStatus = state.gameStatus;
          
          // Send data payload to the WebView's onMessage listener
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'GAME_OVER',
            status: state.gameStatus,
            guesses: state.rowIndex
          }));
        }
      }
    } catch (e) {
      // Ignore JSON parse errors silently so the game doesn't crash
    }
  }, 2000); // Check every 2 seconds

  true; // Required to end injected scripts in React Native iOS
\`;
```

## 4. Pitfalls & White Screen Fixes ⚠️

When building the WebView from scratch, avoid these common problems which cause a blank white screen:

1. **Aggressive `onShouldStartLoadWithRequest` on Android**: 
   NYT Wordle does a lot of internal redirects on initialization (tracking pixels, analytics, ad gateways). If you return `false` in your navigation blocker during the initial load, the WebView will instantly die and turn white. **Do not block internal navigation unless you are 100% sure what the URL is, or just omit `onShouldStartLoadWithRequest` initially until it renders successfully.**
   
2. **Aggressive CSS Hiding**:
   Avoid injecting `display: none !important` on `body` or `#portal-root`. NYT occasionally mounts the entire application react-tree inside an obscure root, and hiding it will turn the game white. If you want to hide their "Subscribe" modals, strictly target:
   `[class*="StatsRegiwall"], [class*="Welcome-module"], [class*="fides-banner"] { display: none !important; }`
   
3. **Flex Layout**: 
   Ensure your `<WebView>` and its parent `<View>` or `<SafeAreaView>` strictly have `flex: 1` applied in their React Native StyleSheets. Without a defined height or flex, the webview defaults to `0px` height.
