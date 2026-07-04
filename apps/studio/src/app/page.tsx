import { TestConnectionButton } from "@/components/TestConnectionButton";
import { LineEditorPanel } from "@/components/LineEditorPanel";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-12 font-sans dark:bg-black">
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
      <LineEditorPanel />
    </div>
  );
}
