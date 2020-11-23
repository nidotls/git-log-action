import * as core from '@actions/core'
import simpleGit, {SimpleGit} from 'simple-git'

async function run(): Promise<void> {
  try {
    const git: SimpleGit = simpleGit()

    const tags = await git.tags()

    if (tags.all.length < 1) {
      core.setFailed(`No tags available: ${JSON.stringify(tags)}`)
      return
    }

    const previousTag =
      tags.all.length < 2 ? null : tags.all[tags.all.length - 2]
    const latestTag = tags.latest

    let commits

    if (previousTag == null) {
      commits = await git.log({
        to: latestTag,
        format: {
          abbrev: '%h',
          author: '@%an',
          message: '%s'
        },
        splitter: '\n',
        multiLine: false
      })
    } else {
      commits = await git.log({
        from: previousTag,
        to: latestTag,
        format: {
          abbrev: '%h',
          author: '@%an',
          message: '%s'
        },
        splitter: '\n',
        multiLine: false
      })
    }

    let textLog = ''
    let markdownLog = ''

    for (const commit of commits.all) {
      textLog += `${commit.abbrev} - ${commit.author} - ${commit.message}\n`
      markdownLog += `[${commit.abbrev}](${process.env.GITHUB_REPOSITORY}/${process.env.GITHUB_REPOSITORY}/commit/${commit.abbrev}) ${commit.author} - ${commit.message}\n`
    }

    core.info(`previousTag: ${previousTag}`)
    core.info(`latestTag: ${latestTag}`)
    core.info(textLog)

    core.setOutput('log', textLog)
    core.setOutput('markdownLog', markdownLog)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
