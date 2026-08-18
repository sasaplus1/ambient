/** Numbers are allowed as well as strings, so a count keeps its own type */
export type Option<T extends string | number> = {
  value: T;
  label: string;
};

type OptionRowProps<T extends string | number> = {
  label: string;
  options: readonly Option<T>[];
  selected: T;
  onChange: (value: T) => void;
};

/**
 * Lays out a small set of choices as segments.
 * A select element is avoided because the native picker is awkward on a small
 * screen.
 */
export function OptionRow<T extends string | number>({
  label,
  options,
  selected,
  onChange,
}: OptionRowProps<T>) {
  return (
    <div class="setting-options" role="group" aria-label={label}>
      <span class="setting-options__label">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          class="setting-options__choice"
          aria-pressed={option.value === selected}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
