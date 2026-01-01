# Project Roadmap

## Phase 2: Engagement & Sustainability

This phase focuses on understanding user behavior through privacy-focused analytics and enabling community support via cryptocurrency donations.

### 1. Reporting & Usage Tracking
To better understand how Dragger is used and identify areas for improvement, we will implement a lightweight, privacy-preserving reporting system.

*   **Goal**: Track core usage metrics without compromising user privacy.
*   **Metrics to Track**:
    *   **Session Start**: When the extension is activated.
    *   **Element Edited**: Count of elements modified (aggregated, no DOM details).
    *   **Tab Activation**: Interaction with different editor tabs (Layout, Typography, etc.) to see which features are most popular.
*   **Privacy First**:
    *   No logging of URL, page content, or specific text user types.
    *   Anonymous unique ID (generated locally, resettable).
    *   Opt-out mechanism in settings.

### 2. Crypto Donations (ETH + L2s)
Allow users to support the development of Dragger directly through the blockchain.

*   **Goal**: Provide a seamless way for users to donate using Ethereum-compatible networks.
*   **Supported Networks**:
    *   Ethereum Mainnet
    *   Base
    *   Optimism
    *   Arbitrum
*   **Implementation Plan**:
    *   **"Support Us" Button**: Add a prominent button in the extension popup or header.
    *   **Donation Modal**:
        *   Display developer wallet address / ENS.
        *   QR Code for easy mobile scanning.
        *   "Copy Address" click-to-copy functionality.
    *   *(Future)* **Connect Wallet**: Optional integration for one-click transactions for users with browser wallets (Metamask, Rabby), though manual copy-paste will be the MVP.
