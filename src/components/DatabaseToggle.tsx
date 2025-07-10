
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Database, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DatabaseToggleProps {
  onToggle: (useSupabase: boolean) => void;
  currentMode: boolean; // true for Supabase, false for local
}

export function DatabaseToggle({ onToggle, currentMode }: DatabaseToggleProps) {
  return (
    <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium text-gray-700">Fonte de dados:</span>
      
      <Button
        variant={!currentMode ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(false)}
        className="flex items-center space-x-1"
      >
        <HardDrive className="w-4 h-4" />
        <span>Local</span>
      </Button>
      
      <Button
        variant={currentMode ? "default" : "outline"}
        size="sm"
        onClick={() => onToggle(true)}
        className="flex items-center space-x-1"
      >
        <Database className="w-4 h-4" />
        <span>Supabase</span>
      </Button>
      
      <Badge variant={currentMode ? "default" : "secondary"}>
        {currentMode ? "Banco de Dados" : "Memória Local"}
      </Badge>
    </div>
  );
}
