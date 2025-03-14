import * as core from '@actions/core'
import * as github from '@actions/github'
import { CheckReleaseResponse } from './type'

// GitHub bot id taken from (https://api.github.com/users/github-actions[bot])
const githubActionsBotId = 41898282
const maxCommentLength = 65536

// Upsert a comment on the pull request with the release check summary results.
// Including the total affected rows, overall risk level, and detailed results.
export const upsertComment = async (res: CheckReleaseResponse) => {
  const githubToken = process.env.GITHUB_TOKEN || ''
  core.debug(
    `start to create comment with check results with context ${JSON.stringify(github.context)} and githubToken ${githubToken}`
  )
  const context = github.context
  if (context.payload.pull_request == null) {
    throw new Error('no pull request found in the context')
  }

  const octokit = github.getOctokit(githubToken)
  const prNumber = context.payload.pull_request.number
  // Marker to find the comment to update.
  const startMarker = `<!--BYTEBASE_MARKER-PR_${prNumber}-DO_NOT_EDIT-->`
  const totalErrorAdviceCount = (res.results ?? []).reduce(
    (acc, result) =>
      acc +
      (result.advices ?? []).filter(advice => advice.status === 'ERROR').length,
    0
  )
  const totalWarningAdviceCount = (res.results ?? []).reduce(
    (acc, result) =>
      acc +
      (result.advices ?? []).filter(advice => advice.status === 'WARNING')
        .length,
    0
  )
  // Construct the comment message.
  let message = `
## SQL Review Summary

* Total Affected Rows: **${res.affectedRows ?? 0}**
* Overall Risk Level: **${stringifyRiskLevel(res.riskLevel)}**
* Advices Statistics: **${totalErrorAdviceCount} Error(s), ${totalWarningAdviceCount} Warning(s)**
`

  message += `### Detailed Results\n`

  message += `
<table>
  <thead>
    <tr>
      <th>File</th>
      <th>Target</th>
      <th>Affected Rows</th>
      <th>Risk Level</th>
      <th>Advices</th>
    </tr>
  </thead>
  <tbody>`

  for (const result of res.results ?? []) {
    if (message.length > maxCommentLength - 1000) {
      break
    }
    const errorAdvicesCount = (result.advices ?? []).filter(
      advice => advice.status === 'ERROR'
    ).length
    const warningAdvicesCount = (result.advices ?? []).filter(
      advice => advice.status === 'WARNING'
    ).length
    core.debug(`result: ${JSON.stringify(result)}`)
    core.debug(`errorAdvicesCount: ${errorAdvicesCount}`)
    const countSlice: string[] = []
    if (errorAdvicesCount > 0) {
      countSlice.push(`${errorAdvicesCount} Error(s)`)
    }
    if (warningAdvicesCount > 0) {
      countSlice.push(`${warningAdvicesCount} Warning(s)`)
    }
    let advicesCell = '-'
    if (countSlice.length > 0) {
      advicesCell = countSlice.join(', ')
    }
    message += `<tr>
  <td>${result.file}</td>
  <td>${result.target}</td>
  <td>${result.affectedRows ?? 0}</td>
  <td>${stringifyRiskLevel(result.riskLevel)}</td>
  <td>${advicesCell}</td>
</tr>`
  }
  message += `</tbody></table>`

  const { data: comments } = await octokit.rest.issues.listComments({
    ...context.repo,
    issue_number: prNumber
  })
  const foundComments = comments.filter(
    comment =>
      comment.user?.id === githubActionsBotId &&
      comment.body?.startsWith(startMarker)
  )
  if (foundComments.length > 0) {
    const lastComment = foundComments[foundComments.length - 1]
    core.debug(`found existing comment ${lastComment.id}`)
    await octokit.rest.issues.updateComment({
      ...context.repo,
      comment_id: lastComment.id,
      body: `${startMarker}\n${message}`
    })
  } else {
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: prNumber,
      body: `${startMarker}\n${message}`
    })
  }
}

function stringifyRiskLevel(riskLevel: string): string {
  switch (riskLevel) {
    case 'LOW':
      return '🟢 Low'
    case 'MODERATE':
      return '🟡 Moderate'
    case 'HIGH':
      return '🔴 High'
    default:
      return '⚪ None'
  }
}
