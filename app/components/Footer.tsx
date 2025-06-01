export const Footer = () => {
  const buildTimestamp = process.env.NEXT_PUBLIC_BUILD_TIMESTAMP
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH
  const gitHash = process.env.NEXT_PUBLIC_GIT_COMMIT_SHA

  return (
    <footer className="opacity-30 text-xs italic inline-flex gap-3">
      {buildTimestamp && (
        <>
          <span className="not-italic">Version:</span>
          <span>Deployed {new Date(buildTimestamp).toLocaleString()}</span>
          <span>·</span>
          <span>
            Latest Commit:{' '}
            <a
              className="hover:underline cursor-pointer"
              href={`https://github.com/dsernst/simulate-corrupted-election/`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {gitHash?.slice(0, 7)}
            </a>
          </span>
          <span>·</span>
          {branch && !['main', 'unknown'].includes(branch) && (
            <span>Branch: {branch}</span>
          )}
        </>
      )}
    </footer>
  )
}
