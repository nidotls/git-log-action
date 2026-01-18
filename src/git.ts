import * as exec from '@actions/exec'

export interface Commit {
  hash: string
  author: string
  message: string
}

/**
 * Executes a git command and returns the stdout.
 */
async function execGit(args: string[]): Promise<string> {
  let output = ''

  await exec.exec('git', args, {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString()
      }
    },
    silent: true
  })

  return output.trim()
}

/**
 * Gets all tags sorted by version (using version sort).
 * Falls back to creatordate sort if version sort produces unexpected results.
 */
export async function getTags(): Promise<string[]> {
  const output = await execGit(['tag', '--list', '--sort=version:refname'])

  if (!output) {
    return []
  }

  return output.split('\n').filter((tag) => tag.length > 0)
}

/**
 * Gets commits between two refs (exclusive from, inclusive to).
 * If `from` is undefined, gets all commits up to `to`.
 */
export async function getCommitsBetween(
  from: string | undefined,
  to: string
): Promise<Commit[]> {
  // Use a delimiter that's unlikely to appear in commit messages
  const delimiter = '<<GIT_LOG_DELIMITER>>'
  const format = `%h${delimiter}%an${delimiter}%s`

  const range = from ? `${from}..${to}` : to

  const output = await execGit(['log', '--format=' + format, range])

  if (!output) {
    return []
  }

  return output
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      const [hash, author, message] = line.split(delimiter)
      return {
        hash,
        author,
        message
      }
    })
}
