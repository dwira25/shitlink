import type { Request, Response } from "express";
import { RatingService } from "../services/ratingService.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";
import { submitRatingSchema } from "../validators/ratingValidators.js";
import { prisma } from "../config/prisma.js";

const ratings = new RatingService();

function slugParam(req: Request) {
  const slug = req.params.slug;
  if (typeof slug !== "string" || !slug) throw new HttpError(422, "Invalid slug");
  return slug;
}

export const getRatingPage = asyncHandler(async (req: Request, res: Response) => {
  const link = await ratings.getLinkForRating(slugParam(req));
  return ok(res, {
    slug: link.slug,
    minRatingEnabled: link.minRatingEnabled,
    minRating: link.minRating
  });
});

export const submitRating = asyncHandler(async (req: Request, res: Response) => {
  const input = submitRatingSchema.parse(req.body);
  const result = await ratings.submit(
    slugParam(req),
    input.score,
    input.comment || undefined,
    req.ip
  );
  return ok(res, result);
});

// Admin: list ratings (score + comment) for a given link owned by the caller.
export const listRatings = asyncHandler(async (req: Request, res: Response) => {
  const linkId = Number(req.params.id);
  if (!Number.isInteger(linkId) || linkId <= 0) throw new HttpError(422, "Invalid link id");
  return ok(res, await ratings.listForLink(linkId, req.user!.id));
});

// Public rating page — served as self-contained HTML from the backend so the
// visitor never needs the admin SPA. Inline script runs under a per-request
// CSP nonce (see app.ts). Submission POSTs to the API.
export const ratingHtmlPage = asyncHandler(async (req: Request, res: Response) => {
  const slug = slugParam(req);

  let link: Awaited<ReturnType<RatingService["getLinkForRating"]>>;
  try {
    link = await ratings.getLinkForRating(slug);
  } catch (error: any) {
    // Jika rating tidak enabled (error 400), redirect langsung ke destination URL
    if (error.statusCode === 400 && error.message === "Rating is not enabled for this link") {
      // Cari link tanpa cek rating enabled
      const link = await prisma.link.findUnique({
        where: { slug },
        select: {
          id: true,
          slug: true,
          destinationUrl: true,
          status: true,
          expiresAt: true,
          ratingEnabled: true
        }
      });
      
      if (link && link.status === "ACTIVE") {
        if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
          throw new HttpError(410, "Short link expired");
        }
        res.status(302);
        res.setHeader("Location", link.destinationUrl);
        res.setHeader("Cache-Control", "no-store");
        return res.end();
      }
    }
    throw error;
  }

  const nonce = (res.locals as { nonce?: string }).nonce ?? "";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.send(`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Berikan Rating</title>
<style>
  :root { --brand:#6366f1; --bg:#f1f5f9; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background: var(--bg); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .card { background:#fff; border-radius:16px; box-shadow:0 10px 30px rgba(0,0,0,.08);
          padding:40px 32px; width:100%; max-width:440px; text-align:center; }
  h1 { margin:0 0 8px; font-size:1.4rem; color:#0f172a; }
  p.hint { margin:0 0 24px; color:#64748b; font-size:.95rem; }
  .stars { display:flex; justify-content:center; gap:10px; margin-bottom:24px; }
  .stars button { width:56px; height:56px; font-size:1.6rem; border:2px solid #e2e8f0;
                  border-radius:12px; background:#fff; cursor:pointer; color:#cbd5e1;
                  transition: transform .1s ease, border-color .1s ease, color .1s ease; }
  .stars button:hover { transform:scale(1.08); }
  textarea { width:100%; min-height:96px; padding:12px; border:1px solid #e2e8f0; border-radius:10px;
             font: inherit; font-size:.95rem; resize:vertical; margin-bottom:24px; }
  textarea:focus { outline:2px solid var(--brand); outline-offset:-1px; }
  .msg { margin-top:16px; font-weight:600; color:#0f172a; }
  .msg.thanks { color:#16a34a; }
  .msg.warn { color:#d97706; }
  .err { color:#e11d48; }
  #submitBtn { padding:12px 28px; border:0; border-radius:10px; background:var(--brand);
               color:#fff; font:inherit; font-weight:600; cursor:pointer; }
  #submitBtn:disabled { opacity:.6; cursor:default; }
  .stars button.selected { border-color:var(--brand); color:var(--brand); }
</style>
</head>
<body>
<div class="card">
  <h1>Berikan Rating Anda</h1>
  <p class="hint">Berikan rating untuk melanjutkan.</p>
  <div class="stars" id="stars">
    ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-score="${n}">&#9733;</button>`).join("")}
  </div>
  <textarea id="comment" placeholder="Komentar (opsional)" maxlength="1000"></textarea>
  <button type="button" id="submitBtn" hidden>Kirim Rating</button>
  <div class="msg" id="msg"></div>
</div>
<script nonce="${nonce}">
  const slug = ${JSON.stringify(slug)};
  const minEnabled = ${link.minRatingEnabled};
  const minRating = ${link.minRating};
  const msg = document.getElementById("msg");
  const commentBox = document.getElementById("comment");
  const submitBtn = document.getElementById("submitBtn");
  const starButtons = [...document.querySelectorAll(".stars button")];
  let selected = 0;

  function paint() {
    starButtons.forEach((b) => b.classList.toggle("selected", Number(b.dataset.score) <= selected));
  }

  async function send(score) {
    starButtons.forEach((b) => (b.disabled = true));
    submitBtn.disabled = true;
    msg.className = "msg";
    msg.textContent = "Mengirim...";
    try {
      const resp = await fetch("/api/ratings/" + encodeURIComponent(slug), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment: commentBox.value.trim() })
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Gagal mengirim rating");
      if (body.data && body.data.passedMinimum && body.data.redirectUrl) {
        msg.textContent = "Terima kasih! Mengalihkan...";
        window.location.href = body.data.redirectUrl;
      } else {
        msg.className = "msg thanks";
        msg.textContent = "Terima kasih atas penilaian Anda.";
      }
    } catch (err) {
      msg.className = "msg err";
      msg.textContent = err.message || "Terjadi kesalahan.";
      starButtons.forEach((b) => (b.disabled = false));
      submitBtn.disabled = false;
    }
  }

  starButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const score = Number(btn.dataset.score);
      if (minEnabled && score < minRating) {
        // Di bawah minimal: JANGAN simpan ke DB dulu — isi komentar dulu, kirim via tombol
        selected = score;
        paint();
        submitBtn.hidden = false;
        commentBox.focus();
        return;
      }
      send(score);
    });
  });

  submitBtn.addEventListener("click", () => {
    if (selected) send(selected);
  });
</script>
</body>
</html>`);
});
