import * as core from '@actions/core'
import { getTags, getCommitsBetween, Commit } from './git.js'

/**
 * Formats commits as plain text.
 */
export function formatAsText(commits: Commit[]): string {
  return commits
    .map((commit) => `${commit.hash} - @${commit.author} - ${commit.message}`)
    .join('\n')
}

/**
 * Formats commits as markdown with links to the commits.
 */
export function formatAsMarkdown(
  commits: Commit[],
  serverUrl: string,
  repository: string
): string {
  return commits
    .map((commit) => {
      const commitUrl = `${serverUrl}/${repository}/commit/${commit.hash}`
      return `[\`${commit.hash}\`](${commitUrl}) @${commit.author} - ${commit.message}`
    })
    .join('\n')
}

/**
 * The main function for the action.
 */
export async function run(): Promise<void> {
  try {
    // Get optional tag inputs
    const fromTagInput = core.getInput('from-tag')
    const toTagInput = core.getInput('to-tag')

    // Get environment variables for markdown links
    const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com'
    const repository = process.env.GITHUB_REPOSITORY || ''

    let fromTag: string | undefined
    let toTag: string | undefined

    // Resolve tags
    if (fromTagInput || toTagInput) {
      // If either tag is specified, use the inputs
      fromTag = fromTagInput || undefined
      toTag = toTagInput || undefined

      if (!toTag) {
        core.warning('to-tag not specified, will use latest tag')
      }
    }

    // Auto-detect tags if not fully specified
    if (!toTag) {
      const tags = await getTags()

      if (tags.length === 0) {
        core.warning('No tags found in repository')
        core.setOutput('previousTag', '')
        core.setOutput('latestTag', '')
        core.setOutput('log', '')
        core.setOutput('markdownLog', '')
        return
      }

      if (tags.length === 1) {
        core.warning(
          'Only one tag found, changelog will include all commits up to this tag'
        )
        toTag = tags[0]
        // fromTag stays undefined - will get all commits up to toTag
      } else {
        // Use the last two tags
        fromTag = fromTagInput || tags[tags.length - 2]
        toTag = tags[tags.length - 1]
      }
    }

    core.info(
      `Generating changelog from ${fromTag || '(beginning)'} to ${toTag}`
    )

    // Get commits between tags
    const commits = await getCommitsBetween(fromTag, toTag)

    // Format outputs
    const textLog = formatAsText(commits)
    const markdownLog = formatAsMarkdown(commits, serverUrl, repository)

    // Log info
    core.info(`Previous tag: ${fromTag || '(none)'}`)
    core.info(`Latest tag: ${toTag}`)
    core.info(`Found ${commits.length} commits`)
    core.debug(textLog)

    // Set outputs
    core.setOutput('previousTag', fromTag || '')
    core.setOutput('latestTag', toTag)
    core.setOutput('log', textLog)
    core.setOutput('markdownLog', markdownLog)
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unexpected error occurred')
    }
  }
}
