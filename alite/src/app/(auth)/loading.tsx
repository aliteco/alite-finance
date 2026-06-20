export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center px-6" aria-busy="true" aria-live="polite">
      <div className="w-full max-w-sm mx-auto space-y-4">
        <div className="mb-6 text-center space-y-3">
          <div className="skeleton w-12 h-12 rounded-2xl mx-auto" />
          <div className="skeleton h-6 w-32 rounded mx-auto" />
        </div>
        <div className="skeleton h-11 w-full rounded-xl" />
        <div className="skeleton h-11 w-full rounded-xl" />
        <div className="skeleton h-11 w-full rounded-xl" />
      </div>
    </div>
  )
}