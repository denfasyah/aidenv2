export function BackgroundPattern() {
  return (
    <div className="fixed inset-0 -z-50 h-full w-full bg-background overflow-hidden">
      {/* Blurred glowing blobs for modern, clean background without noisy grids */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 -z-10 h-[500px] w-[800px] rounded-full bg-primary/10 blur-[150px]" />
      <div className="absolute bottom-[-20%] right-[-10%] -z-10 h-[400px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
    </div>
  )
}
