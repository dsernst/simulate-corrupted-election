export const Footer = () => {
  return (
    <footer className="opacity-30 text-xs">
      Version:{' '}
      <i className="inline-flex gap-1">
        {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ? (
          <>
            <span>
              Built at{' '}
              {new Date(
                process.env.NEXT_PUBLIC_BUILD_TIMESTAMP
              ).toLocaleString()}
            </span>
            <span>
              Latest Commit: $
              {process.env.NEXT_PUBLIC_GIT_COMMIT_SHA?.slice(0, 7)}
            </span>
            <span>Branch: ${process.env.NEXT_PUBLIC_GIT_BRANCH}</span>
          </>
        ) : (
          'localdev'
        )}
      </i>
    </footer>
  )
}
