# ADMAI iOS

This package wraps the existing ADMAI web app in a native iOS WKWebView using Capacitor.

## No Mac required

The included GitHub Actions workflow builds the iOS project on a free GitHub-hosted macOS runner. It produces an **unsigned IPA** as an Actions artifact.

### Build

1. Upload/push this folder to a GitHub repository.
2. Open **Actions** → **Build ADMAI iOS IPA**.
3. Choose **Run workflow**.
4. Download the `ADMAI-unsigned-ipa` artifact.

### Important: signing

The workflow intentionally creates an unsigned IPA because Apple requires code signing for installation on a physical iPhone. An unsigned IPA cannot be installed normally.

For a personal iPhone, the unsigned IPA can be signed afterward on Windows with a sideloading tool and an Apple ID. A free Apple ID generally means the sideloaded app must be refreshed periodically (commonly every 7 days).

The web files are kept in `www/` and include the current no-loading version of ADMAI.
