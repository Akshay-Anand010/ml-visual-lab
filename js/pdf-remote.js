/** Remote notes live in AIML-IIITH-2026 — never copied into this repo. */

export const NOTES_REPO = "https://github.com/Akshay-Anand010/AIML-IIITH-2026";
export const NOTES_REF = "main";

/** Path segments encoded for URLs. */
export function encodeRepoPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** GitHub blob page (HTML). */
export function githubBlobUrl(path) {
  return `${NOTES_REPO}/blob/${NOTES_REF}/${encodeRepoPath(path)}`;
}

/**
 * CDN URL that serves application/pdf with CORS
 * (raw.githubusercontent.com sets X-Frame-Options: deny).
 */
export function remotePdfUrl(path) {
  return `https://cdn.jsdelivr.net/gh/Akshay-Anand010/AIML-IIITH-2026@${NOTES_REF}/${encodeRepoPath(path)}`;
}

/** In-app notes viewer deep link. */
export function notesViewerHash(path) {
  return `#/notes?doc=${encodeURIComponent(path)}`;
}

export function docFromHash() {
  const q = location.hash.split("?")[1] || "";
  const params = new URLSearchParams(q);
  const doc = params.get("doc");
  return doc ? decodeURIComponent(doc) : null;
}
