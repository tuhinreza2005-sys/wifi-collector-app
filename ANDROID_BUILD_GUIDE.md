# WiFi Collector – Android APK Build Guide (Capacitor)

এই প্রজেক্টটি Capacitor ব্যবহার করে সম্পূর্ণ প্রস্তুত করা হয়েছে যাতে খুব সহজেই Android APK (Debug ও Signed Release) তৈরি করা যায়।

---

## ১. প্রজেক্ট কনফিগারেশন বিবরণী

- **Application ID (Package Name)**: `com.tuhinrezawi.collector`
- **Application Name**: `WiFi Collector`
- **Web Build Output**: `dist/`
- **Android Platform**: Capacitor Android 8.x
- **Config File**: `capacitor.config.ts`
- **Native Android Directory**: `android/`

---

## ২. গিটহাব অ্যাকশনস (GitHub Actions) দিয়ে Signed APK তৈরি করার নিয়ম

প্রজেক্টে `.github/workflows/build-apk.yml` অটোমেশন স্ক্রিপ্ট তৈরি করা রয়েছে। এটি স্বয়ংক্রিয়ভাবে APK তৈরি করে ডাউনলোড করার জন্য প্রস্তুত করে দেবে।

### ধাপ ক: Keystore ফাইল তৈরি (যদি না থাকে)
আপনার কম্পিউটারের টার্মিনালে নিচের কমান্ডটি দিয়ে একটি সাইনিং কীস্টোর ফাইল তৈরি করুন:
```bash
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias
```
*(পাসওয়ার্ড ও তথ্যাদি মনে রাখুন)*

### ধাপ খ: Keystore-কে Base64 এ রূপান্তর করুন
```bash
# Linux / macOS:
base64 -w 0 my-release-key.jks > keystore_base64.txt

# Windows (PowerShell):
[Convert]::ToBase64String([IO.File]::ReadAllBytes("my-release-key.jks")) | Out-File -Encoding utf8 keystore_base64.txt
```

### ধাপ গ: GitHub Secrets কনফিগার করুন
আপনার GitHub Repository-তে যান:
`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret` এ গিয়ে নিচের ৪টি সিক্রেট যোগ করুন:

1. `KEYSTORE_BASE64` : `keystore_base64.txt` ফাইলের ভেতরের সম্পূর্ণ টেক্সট
2. `KEYSTORE_PASSWORD` : কীস্টোর তৈরির সময় দেওয়া পাসওয়ার্ড
3. `KEY_ALIAS` : আপনার অ্যালিয়াস নাম (যেমন: `my-key-alias`)
4. `KEY_PASSWORD` : অ্যালিয়াসের পাসওয়ার্ড

> **নোট**: যদি আপনি এই সিক্রেটগুলো যোগ না-ও করেন, তবুও GitHub Actions কোনো এরর ছাড়াই একটি ফুল-ফাংশনাল **Debug APK** তৈরি করবে যা যেকোনো অ্যান্ড্রয়েড ফোনে ইনস্টল করে ব্যবহার করা যাবে!

### ধাপ ঘ: APK বিল্ড চালু করুন
1. কোড গিটহাবে পুশ করুন (`git push origin main`), অথবা
2. GitHub-এর **Actions** ট্যাবে গিয়ে **Build Android APK (WiFi Collector)** সিলেক্ট করে **Run workflow** বাটনে ক্লিক করুন।
3. বিল্ড শেষ হলে Artifacts সেকশন থেকে সরাসরি **WiFi-Collector-Release.apk** ডাউনলোড করতে পারবেন।

---

## ৩. লোকাল মেশিনে Android Studio দিয়ে APK বিল্ড করার নিয়ম

1. **ডিপেন্ডেন্সি ইন্সটল ও প্রজেক্ট বিল্ড:**
   ```bash
   npm install
   npm run cap:build
   ```

2. **Android Studio-তে ওপেন করা:**
   ```bash
   npx cap open android
   ```
   অথবা সরাসরি Android Studio ওপেন করে `android` ফোল্ডারটি ওপেন করুন।

3. **APK তৈরি:**
   - Android Studio মেনু থেকে: `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)` (টেস্টিংয়ের জন্য)
   - অথবা রিলিজ এর জন্য: `Build` -> `Generate Signed Bundle / APK` -> `APK` নির্বাচন করে আপনার কীস্টোর সিলেক্ট করুন।

---

## ৪. গুরুত্বপূর্ণ npm কমান্ডসমূহ

- `npm run build`: ওয়েব অ্যাপ বিল্ড করে `dist/` ফোল্ডারে রাখে।
- `npm run cap:build`: ওয়েব অ্যাপ বিল্ড করে এবং স্বয়ংক্রিয়ভাবে অ্যান্ড্রয়েড নেটিভ প্রজেক্টে সিন্ক করে (`vite build && cap sync android`)।
- `npm run cap:sync`: পরিবর্তনগুলো দ্রুত অ্যান্ড্রয়েড ফোল্ডারে আপডেট করে।
