# NFT Mint & Rarity Alerts Bot — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that delivers real-time alerts for verified NFT projects across Ethereum, Solana, and Base blockchains. Tracks early mints, rarity traits, whitelist openings, price floor changes, and rare secondary sales through contract/keyword subscriptions and auto-follows trending projects.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- NFT collectors

## Success criteria

- Real-time alerts for verified NFT events with customizable preferences

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open onboarding menu with follow options and auto-follow toggle
- **/follow** (command, actor: user, command: /follow) — Subscribe to project by contract/address, keyword, or creator handle
- **/subscriptions** (command, actor: user, command: /subscriptions) — View and manage active subscriptions with per-type toggles
- **/trending** (command, actor: user, command: /trending) — Discover auto-follow candidates with rapid mention growth

## Flows

### Onboarding
_Trigger:_ /start

1. Present follow options
2. Request contract/address linking
3. Set auto-follow preferences

_Data touched:_ User profile

### Follow Management
_Trigger:_ /follow

1. Validate contract/keyword input
2. Confirm subscription
3. Store follow type and targets

_Data touched:_ Follow subscription

### Notification Delivery
_Trigger:_ Event detection

1. Verify project status
2. Format message with verified tag
3. Push to DM and shared chat

_Data touched:_ Notification event

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User profile** _(retention: persistent)_ — Telegram user/group settings with notification preferences
  - fields: telegram_id, notification_targets, auto_follow_enabled
- **Project** _(retention: persistent)_ — Verified blockchain project metadata
  - fields: contract_address, blockchain, verified_flag
- **Follow subscription** _(retention: persistent)_ — User-defined tracking preferences
  - fields: subscription_type, delivery_targets, notification_types
- **Notification event** _(retention: persistent)_ — Triggered event with delivery status
  - fields: event_type, project_reference, delivery_timestamp

## Integrations

- **Telegram** (required) — Bot API messaging
- **Blockchain Feeds** (required) — Event monitoring for Ethereum/Solana/Base
- **Mention Indexer** (required) — Trending project detection
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Manage verified project list
- Configure blockchain feeds
- Adjust default notification settings

## Notifications

- Immediate event alerts with verified project tagging
- Delivery to both DM and shared chat by default

## Permissions & privacy

- User data encrypted at rest
- Shared chat notifications require user consent
- No transaction execution capabilities

## Edge cases

- Duplicate notifications for multi-chain projects
- Invalid contract address handling
- High-frequency alert throttling

## Required tests

- End-to-end onboarding flow test
- Subscription toggle state persistence test
- Verified/official tag rendering test

## Assumptions

- Default to verified projects only
- Immediate delivery for all events
- Contract/address as primary identifier
