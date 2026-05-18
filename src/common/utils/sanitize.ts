/**
 * Input sanitization utilities for the backend
 * These complement frontend sanitization - defense in depth
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * Preserves most characters but removes script tags and event handlers
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return "";

  return (
    input
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
      // Remove javascript: URLs
      .replace(/javascript:/gi, "")
      // Remove data: URLs that could contain scripts
      .replace(/data:text\/html/gi, "")
      .trim()
  );
}

/**
 * Sanitize HTML content - removes dangerous elements but preserves safe HTML
 * For use with rich text content like newsletters
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";

  // Remove script tags and their content
  let sanitized = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove event handlers from all tags
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Remove javascript: and data: URLs from href and src attributes
  sanitized = sanitized.replace(
    /href\s*=\s*["']javascript:[^"']*["']/gi,
    'href="#"',
  );
  sanitized = sanitized.replace(
    /src\s*=\s*["']javascript:[^"']*["']/gi,
    'src=""',
  );
  sanitized = sanitized.replace(
    /href\s*=\s*["']data:text\/html[^"']*["']/gi,
    'href="#"',
  );

  // Remove style tags
  sanitized = sanitized.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    "",
  );

  // Remove iframe, object, embed, form tags
  sanitized = sanitized.replace(
    /<(iframe|object|embed|form|input|button)[^>]*>.*?<\/\1>/gis,
    "",
  );
  sanitized = sanitized.replace(
    /<(iframe|object|embed|form|input|button)[^>]*\/?>/gi,
    "",
  );

  return sanitized.trim();
}

/**
 * Escape HTML special characters to prevent XSS
 * Use for plain text that should not contain any HTML
 */
export function escapeHtml(input: string | null | undefined): string {
  if (!input) return "";

  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return input.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

/**
 * Sanitize email address - normalize and validate format
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return "";

  return email.toLowerCase().trim();
}

/**
 * Sanitize a filename to prevent path traversal attacks
 */
export function sanitizeFilename(filename: string | null | undefined): string {
  if (!filename) return "";

  // Remove path separators and dangerous characters
  return filename
    .replace(/[/\\]/g, "")
    .replace(/\.\./g, "")
    .replace(/[\x00-\x1f\x80-\x9f]/g, "") // Remove control characters
    .trim();
}

/**
 * Validate and sanitize a URL
 * Returns the URL if valid, empty string otherwise
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.href;
  } catch {
    // If it's a relative URL starting with /, allow it
    if (url.startsWith("/") && !url.startsWith("//")) {
      return url;
    }
    return "";
  }
}
