export const Footer = () => {
  return (
    <footer className="opacity-30 text-xs">
      Version:{' '}
      <i>
        {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ? (
          <>
            Built at{' '}
            {new Date(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP).toLocaleString()}{' '}
            · Latest Commit:{' '}
            {process.env.NEXT_PUBLIC_GIT_COMMIT_SHA?.slice(0, 7)} · Branch:{' '}
            {process.env.NEXT_PUBLIC_GIT_BRANCH}
          </>
        ) : (
          'localdev'
        )}
      </i>
    </footer>
  )
}
