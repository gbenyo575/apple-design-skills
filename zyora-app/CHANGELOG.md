# Changelog

## 0.5.0 — UX/UI redesign & MVP polish

### Product & UX
- **Home answers "how much can I spend?" first.** The spendable balance is the hero, with a daily
  allowance until month end. Total wealth is a tappable row that expands into a clear breakdown
  (spendable vs. saved in goals vs. on its way back) with one sentence explaining the difference.
  The hidden swipe‑down gesture (PanResponder that captured every touch) is gone.
- **Quick actions are real actions:** Send, Save (add to a goal), Plan — instead of shortcuts to tabs.
- **Monthly budget card shows pace:** spent vs. budget with a "today" marker and a status
  (on pace / spending fast / over budget).
- **Plan (was Smart Split):** salary input with live preview, fixed costs are now an editable amount,
  a single stacked bar + legend for income → fixed → protected → spendable, savings presets and a
  slider that no longer jumps, per‑goal monthly allocation with expected dates, a warning when the
  plan doesn't fit the salary, and an explicit "if Spendable runs out" rule.
- **Goals:** create/edit sheet with emoji picker (the old 2‑character emoji field cut off emojis),
  target date, Shield choice and inline validation; goal detail with progress ring, plan, activity,
  add money, **withdraw with Shield cool‑off (cancellable)**, and delete with a clear explanation of
  where the money goes.
- **Shield is one concept, edited in one place:** per goal, with plain‑language options.
- **Overspending is explicit:** when a payment is bigger than Spendable, Zyora says by how much and
  asks (or, if set, automatically covers it from the emergency fund). Other goals are never touched.
- **Insights (was buried under More):** spent so far vs. last month, spending‑pace chart, category
  breakdown with month‑on‑month change and drill‑down, the month as one reconciled flow, savings.
- **Profile is a real account area:** level card, money settings, notification switches, personal
  details, Pro, language, diagnostic log export, reset demo.
- **Friends → Send:** a focused modal flow (recent people, search, amount, optional note, success).
- **Levels** moved from the tab bar to Profile; gamification supports the money habits.
- **Pro** is a calm Free vs. Pro comparison with a waitlist button, not an ad.
- **Notifications** are derived from what actually happened (pay split, Shield releases, budget
  pace, goal milestones) and link to where you can change it.

### Visual system
- Tokens for colour, type scale, spacing, radii and motion; brand purples unchanged.
- Consistent components: text roles, buttons (primary / secondary / tinted / destructive / plain),
  grouped lists, cards used only for grouping, status badges with icon + label, inline banners,
  money input with grouped digits, segmented control, sheets, toasts.
- Chart colours validated for colour‑vision deficiency on the dark surface.
- Removed the permanent demo ribbon and the per‑screen demo badges; the demo nature is stated once
  in Profile and wherever money "moves" (Send).

### Motion & feel
- Reanimated 4 + Gesture Handler: press feedback (120 ms scale), drag‑to‑dismiss sheets with velocity
  projection and rubber‑banding, segmented indicator, balance change settle, progress changes,
  toast in/out along the same edge, one success moment in Send. Reduced motion respected everywhere.
- Haptics on selection, success and errors (one per action). Tabs switch instantly.
- The 1.1 s animated splash on every launch was removed; the native splash fades straight into Home.

### Fixed
- Slider jumping (controlled value updated mid‑drag + a log write on every tick).
- Number pad with no way to finish on iOS (Done bar / CTA pinned above the keyboard).
- Overlapping labels on the split bar; untranslated "saving rate"; empty email/phone fields.
- Spendable balance silently clamped at 0 when overspent.
- Goal monthly amounts that didn't add up to the monthly savings.
- Android back button exiting the app from any screen (now a real navigation stack).
- Logger serialising up to 5 000 events on every event (now debounced).

### Architecture
- Expo Router (tabs + native stack + modal stack) replaces the hand‑rolled screen switch.
- Pure, tested finance module; bilingual copy centralised; demo state v2 with dated transactions.
- Dependencies added via SDK 57‑matched versions: expo-router, react-native-reanimated,
  react-native-worklets, react-native-gesture-handler, react-native-screens, react-native-svg,
  expo-haptics, expo-blur, expo-linking, expo-constants, react-dom, react-native-web,
  @expo/metro-runtime. Removed the unused expo-linear-gradient.
