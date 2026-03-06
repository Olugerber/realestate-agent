import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import type { UserAction, NavigationEvent, ViewStatePatch } from "../../realestate-ui/domain-types.js";
import { NavigateCommand } from "../../realestate-ui/commands/navigate.js";
import { HandleUserActionCommand } from "../../realestate-ui/commands/handle-user-action.js";
import { SyncBackendStateCommand } from "../../realestate-ui/commands/sync-backend-state.js";
import type { Subject } from "codascon";

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

        setSubject((prev) => cloneSubject(prev, patch.updates));

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
