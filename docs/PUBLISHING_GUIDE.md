# Chrome Web Store Publishing Guide: Style Editor

This document outlines the steps and requirements for publishing the **Style Editor** extension to the Chrome Web Store.

## 1. Developer Account Setup
1.  **Sign in**: Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2.  **Pay Fee**: Pay the one-time $5 USD registration fee.
3.  **Account Info**: Complete your developer profile (Contact email, Display Name, etc.).

## 2. Store Listing Assets
You will need the following visual assets for your listing:

| Asset Type | Requirement | Recommendation |
| :--- | :--- | :--- |
| **Extension Icon** | 128x128 px (PNG) | Already exists as `icons/icon128.png` |
| **Screenshots** | At least 1 (max 5) | 1280x800 or 640x400 px (PNG/JPG) |
| **Small Tile** | 440x280 px (PNG/JPG) | Used on the home page |
| **Large Tile** | 920x680 px (PNG/JPG) | Optional |
| **Promo Video** | YouTube URL | Optional |

## 3. Listing Metadata
*   **Item Name**: Style Editor (Matches `manifest.json`)
*   **Summary**: Quickly inspect and edit element styles in real-time. (Max 132 chars)
*   **Detailed Description**: Provide a thorough explanation of features, how to use it, and any recent updates.
*   **Category**: Productivity or Developer Tools.
*   **Language**: English (United States).

## 4. Privacy & Permissions
Google requires detailed justification for permissions:
*   **activeTab**: Justify as "Required to provide styling interface on the current active tab only when the user interacts with the extension icon."
*   **scripting**: Justify as "Used to inject CSS and JS into the webpage to enable real-time styling changes."
*   **Privacy Policy**: You **must** host a privacy policy on a website (e.g., GitHub Pages) and provide the URL. Google requires this for any extension using `scripting` or `tabs`.

## 5. Deployment Package
1.  **Clean up**: Ensure no temporary files or `.git` folders are in the root.
2.  **Zip Root Content**: Zip the extension files into `dragger_extension.zip` while excluding documentation files:
    
    ```bash
    zip -r dragger_extension.zip . -x "*.md"
    ```
    
    **Included files:**
    - `manifest.json`
    - `background.js`
    - `content.js`
    - `content.css`
    - `icons/` folder
3.  **Upload**: Select "New Item" in the Developer Dashboard and upload `dragger_extension.zip`.

## 6. Review & Submission
*   **Single Purpose**: Ensure the listing emphasizes the single purpose: Live CSS editing.
*   **Review Time**: Initial reviews usually take 2-4 business days, but can take up to 2 weeks for permissions like `scripting`.
*   **Updates**: To update the app, change the `"version"` in `manifest.json`, re-zip, and upload to the dashboard.
