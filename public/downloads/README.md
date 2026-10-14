# Android release download

Place the production-signed Android APK here as `vikoba360.apk` before building
and deploying the website. The homepage detects the file and enables the download
button with its actual file size. Without the file it shows an availability message
and a working web-login link instead of a broken download.

Use a release APK with your permanent release signing key. The existing Flutter
project currently signs release builds with debug keys; configure production
signing before distributing it publicly. Keep the signing key and passwords private
and backed up so future updates can use the same certificate. Verify production API
settings and test installation on a real Android phone before distributing.

Deploy this file alongside the public assets. Next.js standalone deployments must
copy `public/` into the running standalone app directory; it is not automatically
included in the standalone output. If using Git, the APK is intentionally ignored:
upload it through your release/deployment process rather than committing a binary.

The download URL is `/downloads/vikoba360.apk`. Publish updates under that filename
using the same signing certificate and an increased Android versionCode.
