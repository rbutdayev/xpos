type Listener = (payload: any) => void;

const EVENT_NAME = 'inventory:updated';

export default function useInventoryUpdate() {
    const notifyUpdate = (payload?: Record<string, any>) => {
        const event = new CustomEvent(EVENT_NAME, { detail: payload || {} });
        window.dispatchEvent(event);
    };

    const subscribe = (listener: Listener) => {
        const handler = (e: Event) => listener((e as CustomEvent).detail);
        window.addEventListener(EVENT_NAME, handler as EventListener);
        return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
    };

    return { notifyUpdate, subscribe };
}

