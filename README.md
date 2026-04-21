# Kurban Bağışını Karşılaştır

Frontend-only Next.js app for comparing Kurban donation options.

The app does not process payments and has no backend. It uses static JSON data and redirects users to official donation pages.

## Stack

- Next.js
- React
- Tailwind CSS
- Static JSON data in `data/kurban.json`

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
localhost:3000
```

## Routes

- `/` organization-first homepage
- `/kurban` all Kurban options and comparison mode
- `/organizations/[slug]` organization detail page

## Data

Official Kurban organization and project data is centralized in:

```text
data/kurban.json
```

UI text is centralized in:

```text
content/common.json
content/pages.json
content/comparison.json
```

Project descriptions are displayed from `data/kurban.json` as written.

## Important

Bu platform bağış işlemi gerçekleştirmez. Bağışlar ilgili kurumların resmi sitelerine yönlendirilir.

Açıklamalar ilgili kurumların resmi sitelerinden alınmıştır.
