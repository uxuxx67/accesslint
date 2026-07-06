#!/usr/bin/env node
/**
 * AccessLint - a zero-dependency CLI that scans HTML files for common
 * WCAG 2.1 accessibility issues.
 *
 * Usage: node accesslint.js <file-or-directory> [--ext .html,.htm]
 */
const fs = require('fs');
const path = require('path');

function findFiles(target, exts) {
  const stats = fs.statSync(target);
  if (stats.isFile()) return [target];
  const results = [];
  for (const entry of fs.readdirSync(target)) {
    const full = path.join(target, entry);
    const st = fs.statSync(full);
    if (st.isDirectory()) results.push(...findFiles(full, exts));
    else if (exts.includes(path.extname(entry).toLowerCase())) results.push(full);
  }
  return results;
}

function checkHtml(file, html) {
  const issues = [];

  if (!/<html[^>]*\blang\s*=/i.test(html)) {
    issues.push({ rule: 'html-has-lang', message: '<html> element is missing a lang attribute.' });
  }

  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  imgTags.forEach((tag, i) => {
    if (!/\balt\s*=/i.test(tag)) {
      issues.push({ rule: 'img-alt', message: `<img> #${i + 1} is missing an alt attribute.` });
    }
  });

  const inputTags = html.match(/<input\b[^>]*>/gi) || [];
  inputTags.forEach((tag, i) => {
    const idMatch = tag.match(/\bid\s*=\s*["']([^"']+)["']/i);
    const ariaLabel = /\baria-label\s*=/i.test(tag) || /\baria-labelledby\s*=/i.test(tag);
    const type = (tag.match(/\btype\s*=\s*["']([^"']+)["']/i) || [, 'text'])[1];
    if (['hidden', 'submit', 'button'].includes(type)) return;
    if (!ariaLabel && idMatch) {
      const idPattern = new RegExp(`<label[^>]*\\bfor\\s*=\\s*["']${idMatch[1]}["']`, 'i');
      if (!idPattern.test(html)) {
        issues.push({ rule: 'input-label', message: `<input> #${i + 1} (id="${idMatch[1]}") has no associated <label>.` });
      }
    } else if (!ariaLabel && !idMatch) {
      issues.push({ rule: 'input-label', message: `<input> #${i + 1} has no id, aria-label, or aria-labelledby.` });
    }
  });

  const links = html.match(/<a\b[^>]*>(.*?)<\/a>/gis) || [];
  links.forEach((tag, i) => {
    const text = tag.replace(/<[^>]+>/g, '').trim();
    if (!text && !/\baria-label\s*=/i.test(tag)) {
      issues.push({ rule: 'link-name', message: `<a> #${i + 1} has no accessible text.` });
    }
    if (/^(click here|here|read more|more)$/i.test(text)) {
      issues.push({ rule: 'link-generic-text', message: `<a> #${i + 1} uses non-descriptive text: "${text}".` });
    }
  });

  const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => parseInt(m[1], 10));
  for (let i = 1; i < headings.length; i++) {
    if (headings[i] - headings[i - 1] > 1) {
      issues.push({ rule: 'heading-order', message: `Heading level jumps from h${headings[i - 1]} to h${headings[i]}.` });
    }
  }

  return issues;
}

function main() {
  const [, , targetArg, ...rest] = process.argv;
  if (!targetArg) {
    console.error('Usage: node accesslint.js <file-or-directory> [--ext .html,.htm]');
    process.exit(1);
  }
  const extFlagIndex = rest.indexOf('--ext');
  const exts = extFlagIndex >= 0 ? rest[extFlagIndex + 1].split(',') : ['.html', '.htm'];

  const files = findFiles(targetArg, exts);
  let totalIssues = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const issues = checkHtml(file, html);
    if (issues.length) {
      console.log(`\n${file}`);
      for (const issue of issues) {
        console.log(`  [${issue.rule}] ${issue.message}`);
      }
      totalIssues += issues.length;
    }
  }
  console.log(`\nScanned ${files.length} file(s), found ${totalIssues} issue(s).`);
  process.exit(totalIssues > 0 ? 1 : 0);
}

main();
