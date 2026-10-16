import { useEffect, useRef, type RefObject } from "react";

export function useOutsideClick(
    refs: RefObject<HTMLElement | null>[],
    callback: () => void
) {
    // Guardamos el callback en un ref para tener siempre la última versión 
    // sin necesidad de meterlo en las dependencias del useEffect
    const savedCallback = useRef(callback);

    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        function handleOutsideClick(event: MouseEvent) {
            if (refs.some(ref => ref.current && ref.current.contains(event.target as Node))) {
                return;
            }
            // Llamamos al callback guardado
            savedCallback.current();
        }

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
        // Quitamos 'callback' de las dependencias. 
        // Como pasas un array literal [searchBarRef], este efecto se ejecutará seguido,
        // pero ya no romperá la lógica ni perderá clics.
    }, [refs]);
}
