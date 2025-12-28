import { ReactNode } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ToolPanel from "./ToolPanel";

interface WorkspaceShellProps {
  children: ReactNode;
}

export default function WorkspaceShell({ children }: WorkspaceShellProps) {
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={18} minSize={15} maxSize={25}>
        <ToolPanel />
      </ResizablePanel>
      
      <ResizableHandle className="bg-border hover:bg-primary/20 transition-colors w-1" />
      
      <ResizablePanel defaultSize={82}>
        <div className="h-full overflow-hidden bg-background">
          {children}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
