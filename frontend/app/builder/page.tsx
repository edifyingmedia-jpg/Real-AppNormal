import { TopBar } from "./components/TopBar";
import { Sidebar } from "./components/Sidebar";
import { Canvas } from "./components/Canvas";
import { PropertiesPanel } from "./components/PropertiesPanel";
import { Preview } from "./components/Preview";
import { ChatPanel } from "./components/ChatPanel";
import { ProjectTree } from "./components/ProjectTree";

export default function BuilderPage() {
  return (
    <div className="flex h-screen flex-col bg-appnormal-bg">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="flex w-64 flex-col border-r border-appnormal-border bg-appnormal-surface">
          <ProjectTree />
          <Sidebar />
        </aside>

        <main className="flex flex-1 flex-col gap-2 p-2">
          <div className="flex flex-1 gap-2">
            <section className="flex flex-1 flex-col rounded-lg border border-appnormal-border bg-appnormal-surface p-2">
              <Canvas />
            </section>
            <section className="w-80 rounded-lg border border-appnormal-border bg-appnormal-surface p-2">
              <PropertiesPanel />
            </section>
          </div>
          <div className="mt-2 flex h-52 gap-2">
            <section className="flex flex-1 rounded-lg border border-appnormal-border bg-appnormal-surface p-2">
              <Preview />
            </section>
            <section className="w-96 rounded-lg border border-appnormal-border bg-appnormal-surface p-2">
              <ChatPanel />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
