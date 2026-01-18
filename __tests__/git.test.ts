import { jest } from '@jest/globals'
import { exec, mockGitOutput } from '../__fixtures__/exec.js'

jest.unstable_mockModule('@actions/exec', () => ({ exec }))

const { getTags, getCommitsBetween } = await import('../src/git.js')

describe('git.ts', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('getTags', () => {
    it('returns an empty array when no tags exist', async () => {
      mockGitOutput({ 'git tag': '' })

      const tags = await getTags()

      expect(tags).toEqual([])
    })

    it('returns tags sorted by version', async () => {
      mockGitOutput({
        'git tag': 'v1.0.0\nv1.1.0\nv2.0.0'
      })

      const tags = await getTags()

      expect(tags).toEqual(['v1.0.0', 'v1.1.0', 'v2.0.0'])
    })

    it('filters out empty lines', async () => {
      mockGitOutput({
        'git tag': 'v1.0.0\n\nv1.1.0\n'
      })

      const tags = await getTags()

      expect(tags).toEqual(['v1.0.0', 'v1.1.0'])
    })
  })

  describe('getCommitsBetween', () => {
    it('returns an empty array when no commits exist', async () => {
      mockGitOutput({ 'git log': '' })

      const commits = await getCommitsBetween('v1.0.0', 'v1.1.0')

      expect(commits).toEqual([])
    })

    it('parses commits correctly', async () => {
      const delimiter = '<<GIT_LOG_DELIMITER>>'
      mockGitOutput({
        'git log': [
          `abc1234${delimiter}John Doe${delimiter}Fix bug in parser`,
          `def5678${delimiter}Jane Smith${delimiter}Add new feature`
        ].join('\n')
      })

      const commits = await getCommitsBetween('v1.0.0', 'v1.1.0')

      expect(commits).toEqual([
        { hash: 'abc1234', author: 'John Doe', message: 'Fix bug in parser' },
        { hash: 'def5678', author: 'Jane Smith', message: 'Add new feature' }
      ])
    })

    it('handles commits without a from tag', async () => {
      const delimiter = '<<GIT_LOG_DELIMITER>>'
      mockGitOutput({
        'git log': `abc1234${delimiter}John Doe${delimiter}Initial commit`
      })

      const commits = await getCommitsBetween(undefined, 'v1.0.0')

      expect(commits).toEqual([
        { hash: 'abc1234', author: 'John Doe', message: 'Initial commit' }
      ])

      // Verify the command was called without a range (just the tag)
      expect(exec).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['log']),
        expect.any(Object)
      )
    })
  })
})
