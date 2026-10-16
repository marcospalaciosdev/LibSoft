const AVATAR_COLORS: string[] = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399',
  '#60A5FA', '#818CF8', '#A78BFA', '#F472B6'
];

export function getRandomPaletteColor(): string {
  const index = Math.floor(Math.random() * AVATAR_COLORS.length);
  return AVATAR_COLORS[index];
}