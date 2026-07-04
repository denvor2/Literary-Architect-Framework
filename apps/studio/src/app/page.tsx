import { TestConnectionButton } from "@/components/TestConnectionButton";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Literary Studio
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Sprint 04 Bootstrap
      </p>
      <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
        Environment Ready
      </p>
      <TestConnectionButton />
    </div>
  );
}
