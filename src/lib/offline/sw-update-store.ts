type Listener = () => void;

let waitingWorker: ServiceWorker | null = null;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function setWaitingWorker(worker: ServiceWorker | null) {
  waitingWorker = worker;
  emit();
}

export function getWaitingWorkerSnapshot(): boolean {
  return waitingWorker !== null;
}

export function getWaitingWorkerServerSnapshot(): boolean {
  return false;
}

export function subscribeWaitingWorker(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Tells the waiting worker to activate now, then the "controllerchange"
 * listener in ServiceWorkerRegistration reloads the page once it takes
 * over. Only ever called from a user-initiated "Update" tap (UpdatePrompt)
 * - never automatically - so a long-lived POS session is never reloaded
 * out from under a cashier mid-sale.
 */
export function applyWaitingUpdate() {
  waitingWorker?.postMessage({ type: "SKIP_WAITING" });
}
