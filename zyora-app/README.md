# Zyora · interactive MVP demo · v0.5.0 · Expo SDK 57

Zyora answers one question first: **"How much can I spend right now without hurting my goals?"**
Every payday is split automatically into fixed costs, protected goal savings and a spendable balance.
Goal money is shielded from everyday spending, and a Shield cool‑off turns impulse withdrawals into a considered choice.

> This is a local demo. It holds no account, moves no real money and connects to no bank.
> Transactions, friends and goals are example data stored on the device.

---

## Run it (first time)

You need three things:

1. **Node.js 22 LTS** (or 20.19.4+) — https://nodejs.org, the "LTS" installer. Check with `node -v`.
2. **Expo Go** on your phone, updated to the version that supports **SDK 57** (App Store / Google Play).
3. The phone and the computer on the **same Wi‑Fi**.

### macOS (Terminal)

```bash
cd ~/Downloads/zyora-app      # the unzipped folder that contains package.json
npm ci                        # installs the exact dependency versions from package-lock.json
npx expo login                # iPhone + Expo Go: sign in with the same Expo account as on the phone
npm start -- --clear
```

Scan the QR code: on **iPhone** with the Camera app, on **Android** from inside Expo Go.

### Windows (PowerShell)

```powershell
cd $HOME\Downloads\zyora-app
npm ci
npx expo login
npm start -- --clear
```

### If the phone can't connect

Stop the server with `Ctrl+C`, then start it through a tunnel:

```bash
npm start -- --clear --tunnel
```

Expo may offer to install `@expo/ngrok` the first time — accept, then run the command again.

### Quick preview in a browser (optional)

```bash
npm run web
```

Opens the app at http://localhost:8081. Useful for a quick look on a laptop; haptics, blur and native
sheets only exist on a phone, so judge feel on a real device.

### Checks

```bash
npm run test:demo
```

Verifies the money model (spendable, overspend, Shield releases), goal allocation, the monthly
summary, formatting, that every text exists in Hungarian and English, every icon name is valid and
every route exists.

**Do not** run `npm update` or `npm audit fix --force` — they replace the SDK‑matched versions.
To add a native library later, use `npx expo install <package>`.

---

## Gyors indítás (magyarul)

1. Telepítsd a Node.js LTS‑t, és frissítsd az Expo Go‑t az SDK 57‑et támogató verzióra.
2. Csomagold ki a ZIP‑et, és nyiss terminált (macOS) vagy PowerShellt (Windows) a `zyora-app` mappában.
3. Futtasd: `npm ci`, majd `npx expo login`, majd `npm start -- --clear`.
4. Olvasd be a QR‑kódot (iPhone: Kamera app, Android: Expo Go). A telefon és a gép legyen ugyanazon a Wi‑Fi‑n.
5. Ha nem csatlakozik: `npm start -- --clear --tunnel`.

---

## Demo script (≈ 3 minutes)

1. **Home** — the spendable balance is the hero. Tap **Teljes vagyon / Total wealth** to see what it is
   made of and why goal money isn't counted as spendable.
2. **Félretétel / Save** → pick a goal → **10 000 Ft hozzáadása**. Spendable drops, the monthly budget
   doesn't — saving isn't spending.
3. **Küldés / Send** → Lilla → type more than your spendable balance. Zyora explains the gap and asks
   before covering it from the emergency fund. Approve and see it on Home and in Insights.
4. **Terv / Plan** — drag the savings slider: the split, each goal's monthly share and its expected date
   update live. Try **Turbó**, then set the salary to 200 000 to see the "doesn’t fit your pay" warning.
5. **Célok / Goals** → Bali → **Kivétel / Withdraw** 10 000 Ft. With a 24 h Shield it goes "on its way"
   and can be cancelled. Tap **Shield védelem** to change the cool‑off.
6. **Statisztika / Insights** — spending pace against the budget, where the money went vs last month, and
   the month as one reconciled flow.
7. **Profil / Profile** — level & missions, Pro preview, notification switches, language, **Reset demo**.

The demo refreshes its example transactions every calendar month, so it never opens on an empty month.

---

## Project structure

```
app/                     Expo Router routes
  _layout.js             providers, native stack, splash handling
  (tabs)/                Home · Plan · Goals · Insights · Profile
  goal/[id].js           goal detail (add, withdraw, Shield, edit, delete)
  send/                  modal stack: choose person → amount → sent
  transactions.js, notifications.js, levels.js, pro.js
src/
  theme.js               colour, type, spacing, radius and motion tokens
  i18n.js                all copy, Hungarian + English
  finance.js             pure money logic (tested)
  AppContext.js          demo state + actions, persisted with AsyncStorage
  components/            Text, Button, Sheet, MoneyInput, SegmentedControl, Progress, Toast, TabBar…
  features/              goal sheets, derived notifications
  services/logger.js     structured, privacy‑safe diagnostic log
scripts/test-demo.cjs    npm run test:demo
```
