import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import type { UserAction, NavigationEvent, ViewStatePatch } from "../../realestate-ui/domain-types.js";
import { NavigateCommand } from "../../realestate-ui/commands/navigate.js";
import { HandleUserActionCommand } from "../../realestate-ui/commands/handle-user-action.js";
import { SyncBackendStateCommand } from "../../realestate-ui/commands/sync-backend-state.js";
import type { Subject } from "codascon";

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function reviveDates(value: unknown): unknown {
  if (typeof value === "string" && ISO_RE.test(value)) return new Date(value);
  if (Array.isArray(value)) return value.map(reviveDates);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = reviveDates(v);
    return out;
  }
  return value;
}

/** Clones a Subject instance, applying `updates` on top. */
export function cloneSubject<T extends Subject>(prev: T, updates: Record<string, unknown> = {}): T {
  return Object.assign(Object.create(Object.getPrototypeOf(prev)) as T, prev, updates);
}

type SetSubject<T> = React.Dispatch<React.SetStateAction<T>>;

export function useActionHandler<T extends Subject>(
  subjectRef: React.MutableRefObject<T>,
  setSubject: SetSubject<T>,
) {
  const navigate = useNavigate();

  const handleNavigation = useCallback(
    (event: NavigationEvent, subject: T) => {
      const navCmd = new NavigateCommand();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const target = (navCmd as any).run(subject, event);
      navigate(target.path, { replace: target.historyMode === "replace" });
    },
    [navigate],
  );

  const handleAction = useCallback(
    async (action: UserAction) => {
      const subject = subjectRef.current;
      const handleCmd = new HandleUserActionCommand();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const intent = (handleCmd as any).run(subject, action);

      // Navigation-only
      if (intent.isNoOp && intent.onSuccessNavigation) {
        handleNavigation(intent.onSuccessNavigation, subject);
        return;
      }

      // Local state only
      if (intent.isNoOp) {
        // Apply local args as updates (e.g. { nextStep: N }, { nextStep: prev })
        if (Object.keys(intent.args).length > 0) {
          setSubject((prev) => cloneSubject(prev, intent.args as Record<string, unknown>));
        }
        return;
      }

      // Backend call
      try {
        const result = await api.command<unknown>(intent.backendCommandName, intent.args);

        const syncCmd = new SyncBackendStateCommand();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const patch: ViewStatePatch = (syncCmd as any).run(subject, {
          commandName: intent.backendCommandName,
          result,
        });

        setSubject((prev) => cloneSubject(prev, reviveDates(patch.updates) as Record<string, unknown>));

        if (patch.pendingNavigation) {
          handleNavigation(patch.pendingNavigation, subject);
        } else if (intent.onSuccessNavigation) {
          handleNavigation(intent.onSuccessNavigation, subject);
        }
      } catch (err) {
        console.error(`Command ${intent.backendCommandName} failed:`, err);
      }
    },
    [subjectRef, setSubject, handleNavigation],
  );

  return handleAction;
}
