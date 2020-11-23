import * as core from '@actions/core'
import simpleGit, {SimpleGit} from 'simple-git'

async function run(): Promise<void> {
  try {
    const git: SimpleGit = simpleGit()

    const tags = await git.tags()

    const previousTag =
      tags.all.length < 2 ? undefined : tags.all[tags.all.length - 2]
    const latestTag =
      tags.all.length < 1 ? undefined : tags.all[tags.all.length - 1]

    const commits = await git.log({
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

    let textLog = ''
    let markdownLog = ''

    for (const commit of commits.all) {
      textLog += `${commit.abbrev} - ${commit.author} - ${commit.message}\n`
      markdownLog += `[\`${commit.abbrev}\`](${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/commit/${commit.abbrev}) ${commit.author} - ${commit.message}\n`
    }

    core.info(`previousTag: ${previousTag}`)
    core.info(`latestTag: ${latestTag}`)
    core.info(textLog)

    core.setOutput('previousTag', previousTag)
    core.setOutput('latestTag', latestTag)
    core.setOutput('log', textLog)
    core.setOutput('markdownLog', markdownLog)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
