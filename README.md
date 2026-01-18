# Git Log Action

![Linter](https://github.com/nidotls/git-log-action/actions/workflows/linter.yml/badge.svg)
![CI](https://github.com/nidotls/git-log-action/actions/workflows/ci.yml/badge.svg)
![Check dist/](https://github.com/nidotls/git-log-action/actions/workflows/check-dist.yml/badge.svg)
![CodeQL](https://github.com/nidotls/git-log-action/actions/workflows/codeql-analysis.yml/badge.svg)
![Coverage](./badges/coverage.svg)

A GitHub Action that generates a commit-based changelog between two Git tags.

## Usage

```yaml
- uses: nidotls/git-log-action@v2
  id: changelog
```

By default, the action auto-detects the two most recent tags and generates a
changelog of commits between them.

### Inputs

| Input      | Description              | Required | Default            |
| ---------- | ------------------------ | -------- | ------------------ |
| `from-tag` | Starting tag (exclusive) | No       | Second-to-last tag |
| `to-tag`   | Ending tag (inclusive)   | No       | Latest tag         |

### Outputs

| Output        | Description                                              |
| ------------- | -------------------------------------------------------- |
| `previousTag` | The resolved starting tag (empty if only one tag exists) |
| `latestTag`   | The resolved ending tag                                  |
| `log`         | Plain text changelog (one commit per line)               |
| `markdownLog` | Markdown formatted changelog with commit links           |

### Examples

**Auto-detect tags:**

```yaml
- uses: nidotls/git-log-action@v2
  id: changelog

- run: echo "${{ steps.changelog.outputs.log }}"
```

**Specify tags manually:**

```yaml
- uses: nidotls/git-log-action@v2
  id: changelog
  with:
    from-tag: v1.0.0
    to-tag: v1.1.0
```

**Use Markdown output in a release:**

```yaml
- uses: nidotls/git-log-action@v2
  id: changelog

- uses: softprops/action-gh-release@v1
  with:
    body: ${{ steps.changelog.outputs.markdownLog }}
```

## Output Formats

**Plain text (`log`):**

```txt
abc1234 - @username - Fix bug in parser
def5678 - @username - Add new feature
```

**Markdown (`markdownLog`):**

<!-- prettier-ignore-start -->
```markdown
[`abc1234`](https://github.com/owner/repo/commit/abc1234) @username - Fix bug in
parser
[`def5678`](https://github.com/owner/repo/commit/def5678) @username - Add new feature
```
<!-- prettier-ignore-end -->

## Development

```bash
npm install       # Install dependencies
npm test          # Run tests
npm run bundle    # Build for distribution
```
