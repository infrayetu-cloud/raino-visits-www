"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { searchHosts } from "@/lib/api";

export interface Host {
  id: string;
  name: string;
  phonenumber?: string;
  contact_phonenumber?: string;
}

interface HostSearchProps {
  onSelectHost: (id: string, name: string, phone: string) => void;
}

export function HostSearch({ onSelectHost }: HostSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [hosts, setHosts] = React.useState<Host[]>([]);
  const [selectedHost, setSelectedHost] = React.useState<Host | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  async function handleSearch(searchQuery: string) {
    setIsLoading(true);
    try {
      const results = await searchHosts(searchQuery);
      setHosts(results);
    } catch (error) {
      toast.error("Search Error", {
        description: "Failed to search hosts",
      });
      setHosts([]);
    } finally {
      setIsLoading(false);
    }
  }
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        handleSearch(query);
      } else {
        setHosts([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (host: Host) => {
    const phone = host.phonenumber || "";
    setSelectedHost(host);
    onSelectHost(host.id, host.name, phone);
    setOpen(false);
    setQuery("");
    setHosts([]);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedHost ? (
            <span>{selectedHost.name}</span>
          ) : (
            "Search for host..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or phone..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : hosts.length === 0 && query.length > 0 ? (
              <CommandEmpty>No hosts found.</CommandEmpty>
            ) : hosts.length === 0 ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Type to search
              </div>
            ) : (
              <CommandGroup>
                {hosts.map((host) => (
                  <CommandItem
                    key={host.id}
                    value={host.id}
                    onSelect={() => handleSelect(host)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedHost?.id === host.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{host.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {host.phonenumber}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
