# native/ - Subme native modules

Landing zone for the Android-native code that turns Subme from "manual + demo"
into true zero-touch auto-detection. None of this runs in Expo Go - it requires
a custom **dev/preview build** (`eas build --profile dev`).

## subme-sms (to build)

The SMS-inbox reader behind the `READ_SMS` permission. The JS side already
expects it - see `src/ingestion/native-sms.ts`, which `require('../../native/subme-sms')`
and falls back gracefully (Expo Go / web → "unavailable", app uses the
simulated feed instead).

**Contract the native module must expose:**

```ts
requestPermission(): Promise<boolean>          // runtime READ_SMS prompt
readInbox(sinceEpochMs: number): Promise<{ sender: string; body: string; date: number }[]>
```

Implement as a local Expo Module (Kotlin):

1. `npx create-expo-module@latest --local subme-sms`
2. In the Kotlin module, query `content://sms/inbox` filtered to `date >= sinceEpochMs`,
   return `{ sender (address), body, date }`. Gate `readInbox` on the permission.
3. Use expo-modules' permission helpers (or `ActivityCompat.requestPermissions`)
   for `requestPermission`.
4. Point the JS `require` in `native-sms.ts` at the generated module package
   name once it exists.

Everything downstream - parsing (`src/ingestion/sms-parse.ts`), the engine
(`src/ingestion/engine.ts`), the review inbox - is done and unit-tested, so the
module just needs to deliver raw messages.

## notification-listener (future)

`NotificationListenerService` config plugin to read payment-app notifications
(GPay, PhonePe, bank apps) - the broadest India source and more Play-policy
friendly than `READ_SMS`. Same destination: emit `RawSms`-shaped events into
the ingestion engine.

## Play Store note

`READ_SMS` is a restricted permission. For internal/direct-APK distribution
(the `preview-apk` profile) it works without review. For public Play Store
listing it needs a permissions declaration + Google approval, or pivot the
primary source to the notification listener.
