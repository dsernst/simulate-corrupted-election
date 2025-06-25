import TimeAgo from 'timeago-react'

import packageJson from '../../package.json'

export const Footer = () => {
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH
  const gitHash = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA

  return (
    <footer className="opacity-30 text-xs inline-flex gap-3">
      <span>v{packageJson.version}</span>
      {buildTimestamp && (
        <>
          <span>·</span>
          <a
            className="hover:underline cursor-pointer"
            href={`https://github.com/dsernst/simulate-corrupted-election/`}
            rel="noopener noreferrer"
            target="_blank"
            title={`Git commit: ${gitHash?.slice(0, 7)}`}
          >
            Built <TimeAgo datetime={buildTimestamp} />
          </a>
          {branch && !['main', 'unknown'].includes(branch) && (
            <>
              <span>·</span>
              <span>Branch: {branch}</span>
            </>
          )}
        </>
      )}
    </footer>
  )
}
