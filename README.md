# AccessLint

*[Русская версия](README.ru.md)*

A zero-dependency Node.js CLI that scans HTML files for common WCAG 2.1 accessibility issues — missing `alt` attributes, unlabeled form inputs, non-descriptive link text, missing `lang` attribute, and skipped heading levels.

## Why

Millions of websites are inaccessible to people using screen readers and other assistive technology. Full accessibility audits are expensive; AccessLint gives developers a fast, free, dependency-free first pass they can run locally or in CI.

## Usage

```bash
node accesslint.js ./public
node accesslint.js index.html --ext .html,.htm
```

Exits with a non-zero status code if issues are found, so it can be wired into CI pipelines.

## Roadmap

- Color contrast analysis via computed CSS
- ARIA role validation
- JSON/SARIF report output
- GitHub Action wrapper

## License

MIT — see [LICENSE](LICENSE).
