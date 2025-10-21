import { useEffect, useRef } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { supabase } from "../utils/supabase/client";

type UseRealtimeOptions<T> = {
  table: string;
  schema?: string;
  channelName?: string;
  enabled?: boolean;
  onInsert?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<T>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<T>) => void;
};

export function useRealtime<T = Record<string, unknown>>({
  table,
  schema = "public",
  channelName,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeOptions<T>): void {
  const insertRef = useRef(onInsert);
  const updateRef = useRef(onUpdate);
  const deleteRef = useRef(onDelete);

  useEffect(() => {
    insertRef.current = onInsert;
  }, [onInsert]);

  useEffect(() => {
    updateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    deleteRef.current = onDelete;
  }, [onDelete]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const channel = supabase
      .channel(channelName ?? `${schema}:${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema, table },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              insertRef.current?.(
                payload as RealtimePostgresChangesPayload<T>,
              );
              break;
            case "UPDATE":
              updateRef.current?.(
                payload as RealtimePostgresChangesPayload<T>,
              );
              break;
            case "DELETE":
              deleteRef.current?.(
                payload as RealtimePostgresChangesPayload<T>,
              );
              break;
            default:
              break;
          }
        },
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, channelName, enabled]);
}
