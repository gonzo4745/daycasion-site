# daycasion.com

The public DayCasion website (one static page), hosted on GitHub Pages like `import`, `legal`, `export` and `legacy`.

- Copy: the app's approved Welcome page wording; images: the app's logo and family photo.
- Footer links: Support, Privacy, Terms, Subscriptions, Account Deletion (legal.daycasion.com), Desktop Import, Legacy.
- "Coming soon to iPhone and Android": replace with App Store / Google Play badges once the apps are public.

## Go-live (needs DNS approval)

1. In this repo, set the Pages custom domain to `daycasion.com` (adds a `CNAME` file).
2. GoDaddy DNS: replace the `@` A records (Bubble's 104.16.36.105, 104.16.42.105, 104.19.240.93, 104.19.241.93) with
   GitHub Pages' 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153; replace the `www` A records with
   a CNAME to `gonzo4745.github.io`.
3. When GitHub shows the certificate as issued, turn on Enforce HTTPS.
