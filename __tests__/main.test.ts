import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import * as git from '../__fixtures__/git.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('../src/git.js', () => git)

const { run, formatAsText, formatAsMarkdown } = await import('../src/main.js')

describe('main.ts', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GITHUB_SERVER_URL: 'https://github.com',
      GITHUB_REPOSITORY: 'owner/repo'
    }

    core.getInput.mockImplementation(() => '')
    git.getTags.mockResolvedValue(['v1.0.0', 'v1.1.0'])
    git.getCommitsBetween.mockResolvedValue([
      { hash: 'abc1234', author: 'John Doe', message: 'Fix bug' },
      { hash: 'def5678', author: 'Jane Smith', message: 'Add feature' }
    ])
  })

  afterEach(() => {
    process.env = originalEnv
    jest.resetAllMocks()
  })

  describe('formatAsText', () => {
    it('formats commits as plain text', () => {
      const commits = [
        { hash: 'abc1234', author: 'John Doe', message: 'Fix bug' },
        { hash: 'def5678', author: 'Jane Smith', message: 'Add feature' }
      ]

      const result = formatAsText(commits)

      expect(result).toBe(
        'abc1234 - @John Doe - Fix bug\ndef5678 - @Jane Smith - Add feature'
      )
    })

    it('returns empty string for no commits', () => {
      expect(formatAsText([])).toBe('')
    })
  })

  describe('formatAsMarkdown', () => {
    it('formats commits as markdown with links', () => {
      const commits = [
        { hash: 'abc1234', author: 'John Doe', message: 'Fix bug' }
      ]

      const result = formatAsMarkdown(
        commits,
        'https://github.com',
        'owner/repo'
      )

      expect(result).toBe(
        '[`abc1234`](https://github.com/owner/repo/commit/abc1234) @John Doe - Fix bug'
      )
    })
  })

  describe('run', () => {
    it('auto-detects tags and generates changelog', async () => {
      await run()

      expect(git.getTags).toHaveBeenCalled()
      expect(git.getCommitsBetween).toHaveBeenCalledWith('v1.0.0', 'v1.1.0')
      expect(core.setOutput).toHaveBeenCalledWith('previousTag', 'v1.0.0')
      expect(core.setOutput).toHaveBeenCalledWith('latestTag', 'v1.1.0')
      expect(core.setOutput).toHaveBeenCalledWith(
        'log',
        expect.stringContaining('abc1234')
      )
      expect(core.setOutput).toHaveBeenCalledWith(
        'markdownLog',
        expect.stringContaining('[`abc1234`]')
      )
    })

    it('uses manual tag inputs when provided', async () => {
      core.getInput.mockImplementation((name: string) => {
        if (name === 'from-tag') return 'v0.9.0'
        if (name === 'to-tag') return 'v1.0.0'
        return ''
      })

      await run()

      expect(git.getTags).not.toHaveBeenCalled()
      expect(git.getCommitsBetween).toHaveBeenCalledWith('v0.9.0', 'v1.0.0')
    })

    it('handles no tags gracefully', async () => {
      git.getTags.mockResolvedValue([])

      await run()

      expect(core.warning).toHaveBeenCalledWith('No tags found in repository')
      expect(core.setOutput).toHaveBeenCalledWith('previousTag', '')
      expect(core.setOutput).toHaveBeenCalledWith('latestTag', '')
      expect(core.setOutput).toHaveBeenCalledWith('log', '')
      expect(core.setOutput).toHaveBeenCalledWith('markdownLog', '')
    })

    it('handles single tag gracefully', async () => {
      git.getTags.mockResolvedValue(['v1.0.0'])

      await run()

      expect(core.warning).toHaveBeenCalledWith(
        'Only one tag found, changelog will include all commits up to this tag'
      )
      expect(git.getCommitsBetween).toHaveBeenCalledWith(undefined, 'v1.0.0')
    })

    it('sets failed status on error', async () => {
      git.getTags.mockRejectedValue(new Error('Git command failed'))

      await run()

      expect(core.setFailed).toHaveBeenCalledWith('Git command failed')
    })
  })
})
