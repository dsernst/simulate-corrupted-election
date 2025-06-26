import { IntersectionResults } from './IntersectionResults'
import { PreliminaryResults } from './PreliminaryResults'
import { RequestTests } from './RequestTests'
import { RevealStartOverLine } from './RevealStartOverLine'
import { TestHistory } from './TestHistory'

export function SimulatedContent() {
  return (
    <div className="mt-8 p-6 shadow-lg rounded-lg w-full max-w-3xl border border-gray-200/80">
      <PreliminaryResults />

      {/* Gray divider */}
      <div className="border-t border-gray-200 my-8" />

      <TestHistory />
      <IntersectionResults />
      <RequestTests />
      <RevealStartOverLine />
    </div>
  )
}
