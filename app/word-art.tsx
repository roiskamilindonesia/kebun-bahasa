import { words } from './lesson-catalog';

export function WordArt({
  index,
  basePath,
  label,
}: {
  index: number;
  basePath: string;
  label?: string;
}) {
  const word = words[index];
  if (word.image)
    return (
      <img
        className="word-art"
        src={basePath + word.image}
        alt={label ?? ''}
        draggable={false}
      />
    );
  const columns = word.themeId === 'insects' ? 5 : 6;
  const rows = word.themeId === 'insects' ? 4 : 3;
  return (
    <span
      className="word-art word-sprite"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{
        backgroundImage: `url("${basePath}/themes/${word.themeId}.png")`,
        backgroundSize: `${columns * 100}% ${rows * 100}%`,
        backgroundPosition: `${((word.position % columns) / (columns - 1)) * 100}% ${(Math.floor(word.position / columns) / (rows - 1)) * 100}%`,
      }}
    />
  );
}
