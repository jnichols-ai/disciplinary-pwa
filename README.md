# Frontline Disciplinary Action Form (PWA)

A mobile-friendly PWA where branch/regional managers fill out a disciplinary
action write-up, generate a PDF matching the company letterhead template, and
submit it directly to the **Disciplinary Action Tracker** board on monday.com
(board id `18418855689`, Service workspace).

## What it does

1. Manager fills out the form (employee info, action type, violation
   category, incident description, corrective action plan).
2. Selecting the **Submitting Manager** auto-fills the office address that
   appears on the generated PDF, pulled from `lib/managerLookup.ts`.
3. **Download PDF** generates a letterhead-style PDF client-side (via jsPDF)
   matching the structure of the original Google Doc template — logo
   top-left, office address top-right, signature lines at the bottom
   (employee + manager only, no HR/regional co-sign).
4. **Submit to Monday Board** generates the same PDF and POSTs it to
   `/api/submit-disciplinary`, which creates an item in the "Pending
   Signature" group of the board and attaches the PDF to the **PDF
   Attachment** file column.

## Spider logo

The real "Frontline" spider logo is at `public/logo.png` (transparent PNG).
The form header (`components/DisciplinaryForm.tsx`) renders it directly via
`<img src="/logo.png">`. For the PDF, `loadLogoDataUrl()` in the same file
fetches that PNG, draws it onto an in-memory canvas with a white background,
and re-encodes it as a JPEG data URL before handing it to
`generateDisciplinaryPdf()` in `lib/generatePdf.ts`. This sidesteps PNG
transparency/decoding edge cases in jsPDF's image pipeline — jsPDF embeds
JPEGs as a raw byte stream with no re-decoding step. `drawLetterhead()` reads
the image's natural aspect ratio (`doc.getImageProperties`) and fits it into
a max 150x60pt box, so the spider mark is never stretched.

The app icons at `public/icons/icon-192.png` and `public/icons/icon-512.png`
are already generated from the real spider logo (centered on a white square).
If the logo is ever replaced, regenerate these two files from the new
artwork — they don't update automatically.

## Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Environment variables

Copy `.env.example` to `.env.local` and set:

```
MONDAY_API_KEY=your-monday-api-token
```

Generate a token in monday.com under **Admin → API**. The token's account
must have access to the Service workspace and the Disciplinary Action
Tracker board.

## Deploying

### GitHub

```bash
git init
git add .
git commit -m "Initial disciplinary action PWA"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Vercel

1. Import the GitHub repo at https://vercel.com/new.
2. Framework preset: Next.js (auto-detected).
3. Add the `MONDAY_API_KEY` environment variable in Project Settings →
   Environment Variables (Production + Preview).
4. Deploy.

## Notes on the Monday integration

- The "Submitting Manager" people column is only populated automatically if
  the manager's name matches an existing monday.com user account exactly
  (case-insensitive). If there's no match, the column is left blank but the
  manager's name still appears in the item title and the PDF.
- Items are created in the **Pending Signature** group by default. Update
  `app/api/submit-disciplinary/route.ts` if you want a different starting
  status.
- Column IDs are hardcoded in `lib/mondayConfig.ts` against the current board
  schema. If columns are renamed or recreated on the board, update the IDs
  there (use `get_board_info` / the monday API to fetch current IDs).
