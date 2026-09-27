# Zyora interaktív MVP-demó · v0.4.1 · Expo SDK 57

Expo / React Native projekt. A kezdőképernyő azonnal megnyílik; nincs bétakód és nincs bankszámlakivonat-import. A példatranzakciók, célok és barátok helyi demóadatok. **Az app nem vezet számlát, nem tart ügyfélpénzt és nem indít valódi utalást.**

## Indítás iPhone-on · Windows PowerShell

1. Telepítsd a Node.js LTS-t, és frissítsd az Expo Go alkalmazást az App Store-ban az SDK 57-et támogató verzióra.
2. Csomagold ki a ZIP-et, és nyiss PowerShellt a kicsomagolt **`zyora-app`** mappában (itt van a `package.json`).
3. Futtasd pontosan ezeket a parancsokat; az `expo login` parancsnál jelentkezz be az Expo-fiókodba:

```powershell
npm ci
npx expo login
npm start -- --clear
```

4. Jelentkezz be az **ugyanabba az Expo-fiókba** a telefonos Expo Go-ban (főoldal → jobb felső profil ikon). A telefon és a számítógép legyen ugyanazon a Wi-Fi-n. A terminál QR-kódját iPhone-on a **Kamera** alkalmazással olvasd be, és nyisd meg Expo Go-ban.
5. Ha a helyi hálózat nem enged kapcsolódni, állítsd le a szervert `Ctrl+C`-vel, majd indítsd:

```powershell
npm start -- --clear --tunnel
```

A tunnel mód szükség esetén felajánlhat egy külön Expo hálózati segédcsomagot. Telepítése után indítsd újra a parancsot.

**SDK:** a csomag Expo SDK 57-et használ. Az Expo Go és a projekt SDK-verziójának egyeznie kell ([Expo útmutató](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/)). Ha verzióhibát látsz, ellenőrizd: `npm list expo` → `expo@57.x.x`, és frissítsd az Expo Go-t. Az iOS-es Expo Go a számítógépen és a telefonon ugyanazzal az Expo-fiókkal indít projektet ([Expo bejelentkezés](https://expo.dev/changelog/expo-go-57-login)). Ne futtass `npm update` vagy `npm audit fix --force` parancsot a projektben.

## Rövid bemutatóútvonal

1. Kezdőlap → elkölthető keret és a teljes vagyon nézetének megnyitása koppintással vagy lehúzással.
2. Smart Split → írj be fizetést, nyomd meg a **Beállít** gombot, válts a 10/20/30%-os módok között, próbáld ki a csúszkát és a Shield időt.
3. Célok → hozz létre új célt, tegyél rá demóösszeget, állíts be célonként Shield időt. A keret, a célösszeg és az XP frissül.
4. Szintek → teljesíts egy küldetést; a haladás, XP és a havi feltételek azonnal változnak. A megjelenített jutalmak csak tervek.
5. Kezdőlap → **Barátok** → keress névre, válassz példaszereplőt, szimulálj pénzküldést. A példatranzakció és a kiadási bontás frissül; valódi pénzmozgás nincs.
6. Több → Hónapom, Elemzés, Barátok, Pro és Beállítások. A Pro koncepció, nem bekapcsolható szolgáltatás.
7. Beállítások → magyar/angol nyelv, naplóexport és **Demó visszaállítása** a kiinduló példához.

Az alkalmazás a helyi demóállapotot menti. A régi v0.3.2 importált számlakivonat-állapotát induláskor törli az előző tárolókulcsról; a projektben nincs importáló modul vagy PDF-hez kötött development build. A strukturált log nem tartalmaz pénzügyi összegeket vagy személyes adatokat.

## Fejlesztői ellenőrzés

```powershell
npm run test:demo
```

A parancs az összegszámítást, célbefizetés és költés elkülönítését, a szimulált pénzküldés hatását és az XP-szintlépést ellenőrzi. Expo Go-n, fizikai telefonon külön ellenőrizendő a billentyűzet, a Shield-választás, a lapváltás, a lehúzási gesztus és az alsó biztonsági terület.
