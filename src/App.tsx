import { Button } from '@/components/ui/button'

function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">mohd-ui</h1>
      <p className="text-muted-foreground">
        A personal shadcn/ui component registry.
      </p>
      <Button>It works</Button>
    </main>
  )
}

export default App
