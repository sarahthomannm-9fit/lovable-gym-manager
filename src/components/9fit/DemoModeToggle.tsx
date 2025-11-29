import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { Eye, EyeOff } from "lucide-react";

export function DemoModeToggle() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="flex items-center space-x-2 bg-card border rounded-lg p-3">
      {isDemoMode ? (
        <Eye className="h-4 w-4 text-primary" />
      ) : (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      )}
      <Label htmlFor="demo-mode" className="cursor-pointer">
        Modo Demonstração
      </Label>
      <Switch
        id="demo-mode"
        checked={isDemoMode}
        onCheckedChange={toggleDemoMode}
      />
    </div>
  );
}
