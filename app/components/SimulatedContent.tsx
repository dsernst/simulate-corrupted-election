import { PreliminaryResults } from './PreliminaryResults'
import { RequestTests } from './RequestTests'
import { RevealStartOverLine } from './RevealStartOverLine'
import { TestHistory } from './TestHistory'

export function SimulatedContent() {
  return (
    <div className="mt-8 p-6 bg-white shadow-lg rounded-lg w-full max-w-3xl">
      <PreliminaryResults />

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="space-y-4">
          <TestHistory />
          <RequestTests />
          <RevealStartOverLine />
        </div>
      </div>
    </div>
  )
}
