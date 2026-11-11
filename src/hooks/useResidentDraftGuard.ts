import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

export function confirmResidentNavigation() {
  return window.dispatchEvent(
    new Event("nine:resident-leave", { cancelable: true }),
  );
}
export function useResidentDraftGuard(dirty: boolean, strictSearch = false) {
  const permit = useRef(false);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (permit.current) {
      permit.current = false;
      return false;
    }
    return (
      dirty &&
      (currentLocation.pathname !== nextLocation.pathname ||
        ((strictSearch || currentLocation.pathname !== "/morador") &&
          currentLocation.search !== nextLocation.search))
    );
  });
  useEffect(() => {
    if (blocker.state !== "blocked") return;
    if (
      confirm("Há informações não salvas nesta tela. Deseja sair sem salvar?")
    )
      blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    if (!dirty) return;
    const leave = (event: Event) => {
      if (
        !confirm(
          "Há informações não salvas nesta tela. Deseja sair sem salvar?",
        )
      )
        event.preventDefault();
    };
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("nine:resident-leave", leave);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("nine:resident-leave", leave);
      window.removeEventListener("beforeunload", unload);
    };
  }, [dirty]);
  return () => {
    permit.current = true;
  };
}
