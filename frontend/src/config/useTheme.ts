type ColorScale = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type PaletteRGB = Record<ColorScale, string>;

export class ThemeManager {
    static get() {
        return localStorage.getItem('theme');
    }

    static set(theme: string) {

        if (theme === 'system') {
            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        } else {
            localStorage.setItem('theme', theme);
            document.body.setAttribute('data-theme', theme);
        }

    }

    static init() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', currentTheme);
    }
}

export class AccentManager {
    private static DEFAULT_ACCENT = 'rgb(59, 130, 246)';

    static get() {
        return localStorage.getItem('accent') || this.DEFAULT_ACCENT;
    }

    private static processAndApply(accentString: string) {
        const rgb = accentString.replace(/[^0-9,]/g, '').split(',');
        if (rgb.length === 3) {
            const r = Number(rgb[0]);
            const g = Number(rgb[1]);
            const b = Number(rgb[2]);
            const palette = this.generatePaletteRGB(r, g, b);
            this.applyToDOM(palette);
        }
    }

    static set(accent: string) {
        localStorage.setItem('accent', accent);
        document.body.setAttribute('data-accent', accent);

        this.processAndApply(accent);
        console.log(this.get());
    }

    static init() {
        const currentAccent = this.get();
        document.body.setAttribute('data-accent', currentAccent);

        this.processAndApply(currentAccent);
    }

    private static generatePaletteRGB(r: number, g: number, b: number): PaletteRGB {
        const palette = {} as PaletteRGB;
        const steps: ColorScale[] = [
            100,
            200,
            300,
            400,
            500,
            600,
            700,
            800,
            900
        ];

        steps.forEach((step) => {
            if (step === 500) {
                palette[step] = `${r} ${g} ${b}`;
            } else if (step < 500) {
                const factor = (500 - step) / 500;
                const newR = Math.round(r + (255 - r) * factor);
                const newG = Math.round(g + (255 - g) * factor);
                const newB = Math.round(b + (255 - b) * factor);
                palette[step] = `${newR} ${newG} ${newB}`;
            } else {
                const factor = (step - 500) / 500;
                const newR = Math.round(r * (1 - factor));
                const newG = Math.round(g * (1 - factor));
                const newB = Math.round(b * (1 - factor));
                palette[step] = `${newR} ${newG} ${newB}`;
            }
        });
        return palette;
    }

    private static applyToDOM(palette: PaletteRGB): void {
        Object.entries(palette).forEach(([step, value]) => {
            document.documentElement.style.setProperty(`--color-primary-${step}`, value);
        });
    }
}
