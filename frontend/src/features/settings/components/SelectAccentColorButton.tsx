import { Button } from "@/shared/components/ui"

interface SelectAccentColorButtonProps {
    color: string;
    isCurrent: boolean;
    setAccent: (color: string) => void;
}

export function SelectAccentColorButton({
    color,
    isCurrent,
    setAccent
}: SelectAccentColorButtonProps) {
    return (
        <Button
            key={color}
            onClick={() => setAccent(color)}
            className={`w-12 h-12 rounded-full border-2 border-white cursor-pointer transition-all hover:scale-110 hover:mx-2 ${isCurrent ? 'ring-1 ring-primary-500 ring-offset-2 shadow-lg' : ''}`}
            style={{ backgroundColor: color }}
            aria-label={color}
        >
            <></>
        </Button>
    );
}