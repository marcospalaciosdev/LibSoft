import { createContext, useState, useContext, type ReactNode } from 'react';

interface TimezoneContextType {
    timezone: string;
    setTimezone: (tz: string) => void;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

export function TimezoneProvider({ children }: { children: ReactNode }) {
    const [timezone, setTimezoneState] = useState<string>(() => {
        return localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
    });

    const setTimezone = (tz: string) => {
        localStorage.setItem('timezone', tz);
        setTimezoneState(tz);
    };

    return (
        <TimezoneContext.Provider value={{ timezone, setTimezone }}>
            {children}
        </TimezoneContext.Provider>
    );
}

export function useTimezone() {
    const context = useContext(TimezoneContext);

    if (!context) {
        throw new Error('useTimezone must be used within TimezoneProvider');
    }
    return context;
}
